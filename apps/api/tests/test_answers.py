import uuid
from typing import Any

import pytest

from app.auth import CurrentUser
from app.models import InterviewTurn
from app.providers.base import ProviderError, STTProvider, Transcript
from app.services.answers import AnswerError, AnswerService, is_effectively_empty, normalize_mime
from app.services.storage import StorageError

USER = CurrentUser(id=uuid.uuid4(), email="dev@example.com", access_token="user-jwt")
AUDIO = b"\x1aE\xdf\xa3" + b"\x00" * 4096


class FakeSTT(STTProvider):
    name = "fake"

    def __init__(
        self, text: str = "A closure keeps its scope.", duration: float = 20.0, fail: bool = False
    ) -> None:
        self.text, self.duration, self.fail = text, duration, fail

    async def transcribe(self, audio: bytes, *, mime_type: str) -> Transcript:
        if self.fail:
            raise ProviderError("stt down")
        return Transcript(self.text, self.duration)


class FakeStorage:
    def __init__(self, fail: bool = False) -> None:
        self.fail = fail
        self.calls: list[dict[str, Any]] = []
        self.deleted: list[str] = []

    async def delete(self, *, bucket: str, path: str, user_token: str) -> None:
        self.deleted.append(path)

    async def upload(self, **kwargs: Any) -> None:
        self.calls.append(kwargs)
        if self.fail:
            raise StorageError("down")


class FakeResult:
    def __init__(self, value: Any) -> None:
        self.value = value

    def scalar_one_or_none(self) -> Any:
        return self.value


class FakeSession:
    def __init__(self, turn: InterviewTurn | None) -> None:
        self.turn = turn
        self.committed = False
        self.statements: list[Any] = []

    async def execute(self, statement: Any) -> FakeResult:
        self.statements.append(statement)
        return FakeResult(self.turn)

    async def commit(self) -> None:
        self.committed = True


def make_turn(status: str = "pending") -> InterviewTurn:
    return InterviewTurn(
        id=uuid.uuid4(),
        interview_id=uuid.uuid4(),
        user_id=USER.id,
        position=1,
        question="What is a closure?",
        ideal_points=["a", "b", "c"],
        source="bank",
        status=status,
    )


def service(
    turn: InterviewTurn | None, stt: FakeSTT | None = None, storage: FakeStorage | None = None
) -> tuple[AnswerService, FakeSession, FakeStorage]:
    session, store = FakeSession(turn), storage or FakeStorage()
    svc = AnswerService(
        session,
        stt or FakeSTT(),
        store,
        max_bytes=10 * 1024 * 1024,  # type: ignore[arg-type]
        max_seconds=180,
    )
    return svc, session, store


async def test_saves_transcript_and_uploads_with_user_token() -> None:
    turn = make_turn()
    svc, session, store = service(turn)
    result = await svc.submit(USER, turn.interview_id, turn.id, AUDIO, "audio/webm;codecs=opus")
    assert result.transcript == "A closure keeps its scope."
    assert turn.status == "answered" and turn.transcript == result.transcript
    assert turn.audio_path == f"{USER.id}/{turn.interview_id}/{turn.id}.webm"
    assert store.calls[0]["user_token"] == "user-jwt"
    assert store.calls[0]["bucket"] == "answer-audio"
    assert session.committed


@pytest.mark.parametrize(
    ("data", "mime", "code"),
    [
        (AUDIO, "video/quicktime", "unsupported_type"),
        (AUDIO, None, "unsupported_type"),
        (b"\x00" * 100, "audio/webm", "empty_audio"),
        (b"\x00" * (10 * 1024 * 1024 + 1), "audio/webm", "too_large"),
    ],
)
async def test_rejects_bad_uploads_before_calling_providers(
    data: bytes, mime: str | None, code: str
) -> None:
    turn = make_turn()
    svc, _, store = service(turn)
    with pytest.raises(AnswerError) as err:
        await svc.submit(USER, turn.interview_id, turn.id, data, mime)
    assert err.value.code == code
    assert store.calls == []


async def test_unknown_or_foreign_turn_is_not_found() -> None:
    svc, _, _ = service(None)
    with pytest.raises(AnswerError) as err:
        await svc.submit(USER, uuid.uuid4(), uuid.uuid4(), AUDIO, "audio/webm")
    assert err.value.code == "not_found"


async def test_evaluated_turn_cannot_be_replaced() -> None:
    turn = make_turn("evaluated")
    svc, _, _ = service(turn)
    with pytest.raises(AnswerError) as err:
        await svc.submit(USER, turn.interview_id, turn.id, AUDIO, "audio/webm")
    assert err.value.code == "already_evaluated"


@pytest.mark.parametrize(
    ("stt", "storage", "code"),
    [
        (FakeSTT(text=" Thank you. "), None, "empty_audio"),
        (FakeSTT(duration=200), None, "too_long"),
        (FakeSTT(fail=True), None, "transcription_failed"),
        (FakeSTT(), FakeStorage(fail=True), "upload_failed"),
    ],
)
async def test_provider_outcomes_map_to_error_codes(
    stt: FakeSTT, storage: FakeStorage | None, code: str
) -> None:
    turn = make_turn()
    svc, session, store = service(turn, stt, storage)
    with pytest.raises(AnswerError) as err:
        await svc.submit(USER, turn.interview_id, turn.id, AUDIO, "audio/mp4")
    assert err.value.code == code
    assert turn.status == "pending" and not session.committed
    # Uploaded audio for a rejected answer is cleaned up (nothing to clean if upload failed)
    expected = [] if code == "upload_failed" else [store.calls[0]["path"]]
    assert store.deleted == expected


@pytest.mark.parametrize(
    ("text", "empty"),
    [
        ("", True),
        ("Thank you.", True),
        (" you ", True),
        ("Thanks for watching!", True),
        ("Um.", True),
        ("A closure keeps scope.", False),
        ("Thank you for the question, so", False),
    ],
)
def test_is_effectively_empty(text: str, empty: bool) -> None:
    assert is_effectively_empty(text) is empty


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("audio/webm;codecs=opus", "audio/webm"),
        ("video/webm", "audio/webm"),
        ("AUDIO/MP4", "audio/mp4"),
        (None, ""),
    ],
)
def test_normalize_mime(raw: str | None, expected: str) -> None:
    assert normalize_mime(raw) == expected
