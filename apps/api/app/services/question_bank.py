import json
from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass(frozen=True, slots=True)
class BankQuestion:
    id: UUID
    role: str
    level: str
    topic: str
    question: str
    ideal_points: list[str]
    # Cosine distance to the job description (lower is closer); None without a JD.
    distance: float | None = None


class QuestionBankRepository(Protocol):
    async def candidates(
        self, roles: list[str], query_embedding: list[float] | None
    ) -> list[BankQuestion]: ...


_BY_SIMILARITY = text(
    """
    select id, role, level, topic, question, ideal_points,
           embedding operator(extensions.<=>) cast(:query as extensions.vector) as distance
    from public.question_bank
    where role = any(:roles) and embedding is not null
    order by distance
    """
)

_RANDOM = text(
    """
    select id, role, level, topic, question, ideal_points, null::float8 as distance
    from public.question_bank
    where role = any(:roles)
    order by random()
    """
)


class SqlQuestionBankRepository:
    """Returns every question for the given roles (the bank is small: ~25 per role), ordered by
    similarity to the JD when there is one, otherwise shuffled. The planner does the rest."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def candidates(
        self, roles: list[str], query_embedding: list[float] | None
    ) -> list[BankQuestion]:
        if query_embedding is None:
            result = await self._session.execute(_RANDOM, {"roles": roles})
        else:
            result = await self._session.execute(
                _BY_SIMILARITY, {"roles": roles, "query": json.dumps(query_embedding)}
            )
        return [
            BankQuestion(
                id=row.id,
                role=row.role,
                level=row.level,
                topic=row.topic,
                question=row.question,
                ideal_points=list(row.ideal_points),
                distance=row.distance,
            )
            for row in result
        ]
