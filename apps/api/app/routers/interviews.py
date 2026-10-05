from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUserDep
from app.db import get_session
from app.schemas.interviews import InterviewCreate, InterviewOut
from app.services.interviews import InterviewService

router = APIRouter(prefix="/interviews", tags=["interviews"])


def get_interview_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> InterviewService:
    return InterviewService(session)


ServiceDep = Annotated[InterviewService, Depends(get_interview_service)]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_interview(
    body: InterviewCreate, user: CurrentUserDep, service: ServiceDep
) -> InterviewOut:
    return InterviewOut.model_validate(await service.create(user.id, body))


@router.get("/{interview_id}")
async def get_interview(
    interview_id: UUID, user: CurrentUserDep, service: ServiceDep
) -> InterviewOut:
    interview = await service.get(user.id, interview_id)
    if interview is None:
        # 404 (not 403) so other users' interview ids aren't confirmed to exist
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    return InterviewOut.model_validate(interview)
