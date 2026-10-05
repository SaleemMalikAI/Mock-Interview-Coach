"""F5: accept a recorded answer, transcribe it and store the audio."""

import asyncio
import logging
import re
import time
from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.models import Interview, InterviewTurn
from app.providers.base import ProviderError, STTProvider
from app.services.storage import StorageError, SupabaseStorage

logger = logging.getLogger(__name__)

AUDIO_BUCKET = "answer-audio"
ALLOWED_AUDIO_TYPES = {
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
}
# Anything this small can't hold a spoken answer (a 1 s opus clip is already ~2-4 KB).
MIN_AUDIO_BYTES = 1024
# Whisper "hears" these on silence or noise. A transcript made only of them counts as empty.
_HALLUCINATIONS = {
    "",
    "you",
    "thank you",
    "thanks",
    "thank you for watching",
    "thanks for watching",
    "bye",
    "okay",
    "so",
    "um",
    "uh",
}

AnswerErrorCode = Literal[
    "not_found",
    "already_evaluated",
    "unsupported_type",
    "too_large",
    "empty_audio",
    "too_long",
    "transcription_failed",
    "upload_failed",
]


class AnswerError(Exception):
    def __init__(self, code: AnswerErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True, slots=True)
class AnswerResult:
    turn_id: UUID
    transcript: str
    duration_seconds: float | None
    audio_path: str


def normalize_mime(content_type: str | None) -> str:
    """'audio/webm;codecs=opus' -> 'audio/webm'. Some browsers report video/webm for audio."""
    mime = (content_type or "").split(";")[0].strip().lower()
    return mime.replace("video/", "audio/", 1) if mime in ("video/webm", "video/mp4") else mime


def is_effectively_empty(transcript: str) -> bool:
    words = re.sub(r"[^a-z' ]+", " ", transcript.lower()).split()
    return " ".join(words) in _HALLUCINATIONS


class AnswerService:
    def __init__(
        self,
        session: AsyncSession,
        stt: STTProvider,
        storage: SupabaseStorage,
        *,
        max_bytes: int,
        max_seconds: float,
    ) -> None:
        self._session = session
        self._stt = stt
        self._storage = storage
        self._max_bytes = max_bytes
        self._max_seconds = max_seconds

    def validate_upload(self, data: bytes, content_type: str | None) -> str:
        mime = normalize_mime(content_type)
        if mime not in ALLOWED_AUDIO_TYPES:
            raise AnswerError("unsupported_type", f"Unsupported audio type: {mime or 'unknown'}")
        if len(data) > self._max_bytes:
            raise AnswerError("too_large", "The recording is larger than 10 MB.")
        if len(data) < MIN_AUDIO_BYTES:
            raise AnswerError("empty_audio", "The recording is empty.")
        return mime

    async def submit(
        self,
        user: CurrentUser,
        interview_id: UUID,
        turn_id: UUID,
        data: bytes,
        content_type: str | None,
    ) -> AnswerResult:
        mime = self.validate_upload(data, content_type)
        turn = await self._get_turn(user.id, interview_id, turn_id)
        if turn.status == "evaluated":
            raise AnswerError("already_evaluated", "This answer has already been scored.")

        path = f"{user.id}/{interview_id}/{turn_id}.{ALLOWED_AUDIO_TYPES[mime]}"
        started = time.perf_counter()
        # Transcribe and upload in parallel; both must succeed.
        stt_result, upload_result = await asyncio.gather(
            self._stt.transcribe(data, mime_type=mime),
            self._storage.upload(
                bucket=AUDIO_BUCKET,
                path=path,
                data=data,
                content_type=mime,
                user_token=user.access_token,
            ),
            return_exceptions=True,
        )
        if isinstance(upload_result, StorageError):
            logger.error("audio upload failed for turn %s: %s", turn_id, upload_result)
            raise AnswerError("upload_failed", "We couldn't save your recording.")
        if isinstance(upload_result, BaseException):
            raise upload_result
        try:
            if isinstance(stt_result, ProviderError):
                logger.error("transcription failed for turn %s: %s", turn_id, stt_result)
                raise AnswerError("transcription_failed", "We couldn't transcribe your answer.")
            if isinstance(stt_result, BaseException):
                raise stt_result
            transcript = stt_result
            if is_effectively_empty(transcript.text):
                raise AnswerError("empty_audio", "We couldn't hear an answer in that recording.")
            if transcript.duration_seconds and transcript.duration_seconds > self._max_seconds + 5:
                raise AnswerError("too_long", "Answers can be at most 3 minutes long.")
        except BaseException:
            # Don't keep audio for an answer we rejected.
            await self._storage.delete(bucket=AUDIO_BUCKET, path=path, user_token=user.access_token)
            raise

        turn.transcript = transcript.text
        turn.audio_path = path
        turn.duration_seconds = (
            round(transcript.duration_seconds, 2) if transcript.duration_seconds else None
        )
        turn.status = "answered"
        await self._session.execute(
            update(Interview)
            .where(Interview.id == interview_id, Interview.status == "setup")
            .values(status="in_progress")
        )
        await self._session.commit()
        logger.info(
            "answer saved for turn %s: %.1fs audio, %d chars, %.0f ms",
            turn_id,
            transcript.duration_seconds or 0,
            len(transcript.text),
            (time.perf_counter() - started) * 1000,
        )
        return AnswerResult(turn_id, transcript.text, transcript.duration_seconds, path)

    async def _get_turn(self, user_id: UUID, interview_id: UUID, turn_id: UUID) -> InterviewTurn:
        turn = (
            await self._session.execute(
                select(InterviewTurn).where(
                    InterviewTurn.id == turn_id,
                    InterviewTurn.interview_id == interview_id,
                    InterviewTurn.user_id == user_id,
                )
            )
        ).scalar_one_or_none()
        if turn is None:
            raise AnswerError("not_found", "Question not found.")
        return turn
