from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUserDep
from app.config import get_settings
from app.db import get_session
from app.providers.factory import get_stt_provider
from app.services.answers import AnswerError, AnswerService
from app.services.storage import SupabaseStorage

router = APIRouter(prefix="/interviews/{interview_id}/turns/{turn_id}", tags=["answers"])

_STATUS_BY_CODE = {
    "not_found": status.HTTP_404_NOT_FOUND,
    "already_evaluated": status.HTTP_409_CONFLICT,
    "unsupported_type": status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
    "too_large": status.HTTP_413_CONTENT_TOO_LARGE,
    "empty_audio": status.HTTP_422_UNPROCESSABLE_CONTENT,
    "too_long": status.HTTP_422_UNPROCESSABLE_CONTENT,
    "transcription_failed": status.HTTP_502_BAD_GATEWAY,
    "upload_failed": status.HTTP_502_BAD_GATEWAY,
}


class AnswerOut(BaseModel):
    turn_id: UUID
    transcript: str
    duration_seconds: float | None
    status: str = "answered"


def get_answer_service(session: Annotated[AsyncSession, Depends(get_session)]) -> AnswerService:
    settings = get_settings()
    return AnswerService(
        session,
        get_stt_provider(),
        SupabaseStorage(
            url=settings.supabase_url, publishable_key=settings.supabase_publishable_key
        ),
        max_bytes=settings.answer_max_bytes,
        max_seconds=settings.answer_max_seconds,
    )


@router.post("/answer")
async def submit_answer(
    interview_id: UUID,
    turn_id: UUID,
    audio: UploadFile,
    user: CurrentUserDep,
    service: Annotated[AnswerService, Depends(get_answer_service)],
) -> AnswerOut:
    # Read at most one byte over the limit, so oversized uploads aren't fully buffered.
    data = await audio.read(get_settings().answer_max_bytes + 1)
    try:
        result = await service.submit(user, interview_id, turn_id, data, audio.content_type)
    except AnswerError as exc:
        raise HTTPException(
            status_code=_STATUS_BY_CODE[exc.code],
            detail={"code": exc.code, "message": exc.message},
        ) from exc
    return AnswerOut(
        turn_id=result.turn_id,
        transcript=result.transcript,
        duration_seconds=result.duration_seconds,
    )
