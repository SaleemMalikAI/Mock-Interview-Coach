import logging
from dataclasses import dataclass
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Interview, InterviewTurn
from app.schemas.interviews import InterviewCreate, InterviewSummaryOut
from app.services.question_plan import QuestionPlanner

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class InterviewWithTurns:
    interview: Interview
    turns: list[InterviewTurn]


class InterviewService:
    """The API connects as a privileged role that bypasses RLS, so every query here
    must scope by user_id itself."""

    def __init__(self, session: AsyncSession, planner: QuestionPlanner) -> None:
        self._session = session
        self._planner = planner

    async def create(self, user_id: UUID, data: InterviewCreate) -> InterviewWithTurns:
        # Build the plan before opening the write transaction: it calls external providers.
        plan = await self._planner.build(data)

        interview = Interview(id=uuid4(), user_id=user_id, **data.model_dump())
        turns = [
            InterviewTurn(
                interview_id=interview.id,
                user_id=user_id,
                position=position,
                question=planned.question,
                ideal_points=planned.ideal_points,
                source=planned.source,
                question_bank_id=planned.question_bank_id,
            )
            for position, planned in enumerate(plan, start=1)
        ]
        self._session.add(interview)
        self._session.add_all(turns)
        # One transaction; eager_defaults returns status/created_at from the INSERTs.
        await self._session.commit()
        logger.info(
            "interview %s created (%s/%s/%s) with %d turns",
            interview.id,
            data.role,
            data.level,
            data.type,
            len(turns),
        )
        return InterviewWithTurns(interview, turns)

    async def get(self, user_id: UUID, interview_id: UUID) -> InterviewWithTurns | None:
        interview = (
            await self._session.execute(
                select(Interview).where(Interview.id == interview_id, Interview.user_id == user_id)
            )
        ).scalar_one_or_none()
        if interview is None:
            return None
        turns = (
            await self._session.execute(
                select(InterviewTurn)
                .where(InterviewTurn.interview_id == interview.id)
                .order_by(InterviewTurn.position)
            )
        ).scalars()
        return InterviewWithTurns(interview, list(turns))

    async def list(self, user_id: UUID, limit: int = 50) -> list[InterviewSummaryOut]:
        answered = (
            select(func.count())
            .where(
                InterviewTurn.interview_id == Interview.id,
                InterviewTurn.status.in_(("answered", "evaluated")),
            )
            .correlate(Interview)
            .scalar_subquery()
        )
        rows = await self._session.execute(
            select(Interview, answered.label("answered"))
            .where(Interview.user_id == user_id)
            .order_by(Interview.created_at.desc())
            .limit(limit)
        )
        return [
            InterviewSummaryOut(
                id=interview.id,
                role=interview.role,  # type: ignore[arg-type]
                level=interview.level,  # type: ignore[arg-type]
                type=interview.type,  # type: ignore[arg-type]
                num_questions=interview.num_questions,
                status=interview.status,  # type: ignore[arg-type]
                overall_score=float(interview.overall_score)
                if interview.overall_score is not None
                else None,
                answered=count,
                created_at=interview.created_at,
            )
            for interview, count in rows
        ]
