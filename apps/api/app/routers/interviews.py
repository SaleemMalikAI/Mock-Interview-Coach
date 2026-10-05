from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUserDep
from app.config import get_settings
from app.db import get_session
from app.providers.factory import get_embedding_provider, get_llm_provider
from app.schemas.interviews import (
    InterviewCreate,
    InterviewOut,
    InterviewSummaryOut,
    PracticeCreate,
    TurnOut,
)
from app.services.interviews import InterviewService, InterviewWithTurns
from app.services.question_bank import SqlQuestionBankRepository
from app.services.question_plan import QuestionPlanner

router = APIRouter(prefix="/interviews", tags=["interviews"])


def get_interview_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> InterviewService:
    planner = QuestionPlanner(
        SqlQuestionBankRepository(session),
        get_embedding_provider(),
        get_llm_provider(),
        generation_timeout=get_settings().jd_generation_timeout_seconds,
    )
    return InterviewService(session, planner)


ServiceDep = Annotated[InterviewService, Depends(get_interview_service)]


def to_out(result: InterviewWithTurns) -> InterviewOut:
    out = InterviewOut.model_validate(result.interview)
    out.turns = [TurnOut.model_validate(turn) for turn in result.turns]
    return out


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_interview(
    body: InterviewCreate, user: CurrentUserDep, service: ServiceDep
) -> InterviewOut:
    return to_out(await service.create(user.id, body))


@router.post("/practice", status_code=status.HTTP_201_CREATED)
async def create_practice_interview(
    body: PracticeCreate, user: CurrentUserDep, service: ServiceDep
) -> InterviewOut:
    result = await service.create_practice(user.id, body.question_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return to_out(result)


@router.get("")
async def list_interviews(user: CurrentUserDep, service: ServiceDep) -> list[InterviewSummaryOut]:
    return await service.list(user.id)


@router.get("/{interview_id}")
async def get_interview(
    interview_id: UUID, user: CurrentUserDep, service: ServiceDep
) -> InterviewOut:
    result = await service.get(user.id, interview_id)
    if result is None:
        # 404 (not 403) so other users' interview ids aren't confirmed to exist
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    return to_out(result)
