import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.auth import CurrentUser, get_current_user
from app.main import app
from app.models import Interview, InterviewTurn
from app.routers.interviews import get_interview_service
from app.schemas.interviews import InterviewCreate
from app.services.interviews import InterviewWithTurns

USER = CurrentUser(id=uuid.uuid4(), email="dev@example.com")
VALID = {"role": "full_stack", "level": "mid", "type": "technical", "num_questions": 5}


class FakeInterviewService:
    def __init__(self) -> None:
        self.rows: dict[uuid.UUID, InterviewWithTurns] = {}

    async def create(self, user_id: uuid.UUID, data: InterviewCreate) -> InterviewWithTurns:
        row = Interview(
            id=uuid.uuid4(),
            user_id=user_id,
            status="setup",
            overall_score=None,
            created_at=datetime.now(UTC),
            completed_at=None,
            **data.model_dump(),
        )
        turns = [
            InterviewTurn(
                id=uuid.uuid4(),
                interview_id=row.id,
                user_id=user_id,
                position=n,
                question=f"Question {n}?",
                ideal_points=["secret point"],
                source="bank",
                status="pending",
            )
            for n in range(1, data.num_questions + 1)
        ]
        self.rows[row.id] = InterviewWithTurns(row, turns)
        return self.rows[row.id]

    async def get(self, user_id: uuid.UUID, interview_id: uuid.UUID) -> InterviewWithTurns | None:
        found = self.rows.get(interview_id)
        return found if found and found.interview.user_id == user_id else None


@pytest.fixture
def service() -> FakeInterviewService:
    return FakeInterviewService()


@pytest.fixture
async def client(service: FakeInterviewService) -> AsyncIterator[AsyncClient]:
    app.dependency_overrides[get_current_user] = lambda: USER
    app.dependency_overrides[get_interview_service] = lambda: service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


async def test_create_interview_returns_201(client: AsyncClient) -> None:
    response = await client.post(
        "/interviews", json={**VALID, "job_description": "  We build APIs.  "}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "setup"
    assert body["job_description"] == "We build APIs."
    assert body["num_questions"] == 5
    assert [t["position"] for t in body["turns"]] == [1, 2, 3, 4, 5]
    # The grading key must never reach the browser
    assert all("ideal_points" not in t for t in body["turns"])


async def test_get_own_interview(client: AsyncClient) -> None:
    created = (await client.post("/interviews", json=VALID)).json()
    response = await client.get(f"/interviews/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


async def test_other_users_interview_is_404(
    client: AsyncClient, service: FakeInterviewService
) -> None:
    other = await service.create(uuid.uuid4(), InterviewCreate.model_validate(VALID))
    response = await client.get(f"/interviews/{other.interview.id}")
    assert response.status_code == 404


@pytest.mark.parametrize(
    "overrides",
    [
        {"num_questions": 4},
        {"role": "designer"},
        {"level": "staff"},
        {"type": "coding"},
        {"job_description": "x" * 5001},
        {"role": "behavioral", "type": "technical"},
        {"user_id": str(uuid.uuid4())},
    ],
)
async def test_invalid_payloads_are_422(client: AsyncClient, overrides: dict[str, Any]) -> None:
    response = await client.post("/interviews", json={**VALID, **overrides})
    assert response.status_code == 422


async def test_requires_auth() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        response = await c.post("/interviews", json=VALID)
    assert response.status_code == 401


def test_blank_job_description_becomes_none() -> None:
    assert (
        InterviewCreate.model_validate({**VALID, "job_description": "   "}).job_description is None
    )


def test_behavioral_role_accepts_behavioral_type() -> None:
    data = InterviewCreate.model_validate({**VALID, "role": "behavioral", "type": "behavioral"})
    assert data.role == "behavioral"
    with pytest.raises(ValidationError):
        InterviewCreate.model_validate({**VALID, "role": "behavioral", "type": "mixed"})
