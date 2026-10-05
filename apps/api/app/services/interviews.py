import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Interview
from app.schemas.interviews import InterviewCreate

logger = logging.getLogger(__name__)


class InterviewService:
    """The API connects as a privileged role that bypasses RLS, so every query here
    must scope by user_id itself."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, user_id: UUID, data: InterviewCreate) -> Interview:
        interview = Interview(user_id=user_id, **data.model_dump())
        self._session.add(interview)
        await self._session.commit()
        await self._session.refresh(interview)
        logger.info(
            "interview %s created (%s/%s/%s)", interview.id, data.role, data.level, data.type
        )
        return interview

    async def get(self, user_id: UUID, interview_id: UUID) -> Interview | None:
        result = await self._session.execute(
            select(Interview).where(Interview.id == interview_id, Interview.user_id == user_id)
        )
        return result.scalar_one_or_none()
