from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUserDep
from app.db import get_session
from app.services.questions import QuestionService

router = APIRouter(prefix="/questions", tags=["questions"])


class QuestionOut(BaseModel):
    """ideal_points are left out on purpose: they grade "practice this question"."""

    id: UUID
    role: str
    level: str
    type: str
    topic: str
    question: str


class QuestionPage(BaseModel):
    items: list[QuestionOut]
    total: int
    topics: list[str]


@router.get("")
async def search_questions(
    _: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_session)],
    q: Annotated[str | None, Query(max_length=100)] = None,
    role: Literal["frontend", "full_stack", "ai_engineer", "behavioral"] | None = None,
    level: Literal["junior", "mid", "senior"] | None = None,
    topic: Annotated[str | None, Query(max_length=60)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> QuestionPage:
    service = QuestionService(session)
    rows, total = await service.search(
        q=q, role=role, level=level, topic=topic, limit=limit, offset=offset
    )
    return QuestionPage(
        items=[QuestionOut.model_validate(r, from_attributes=True) for r in rows],
        total=total,
        topics=await service.topics(),
    )
