"""F14: browse and search the question bank."""

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass(frozen=True, slots=True)
class QuestionRow:
    id: UUID
    role: str
    level: str
    type: str
    topic: str
    question: str


_SEARCH = text(
    """
    select id, role, level, type, topic, question, count(*) over () as total
    from public.question_bank
    where (cast(:role as text) is null or role = :role)
      and (cast(:level as text) is null or level = :level)
      and (cast(:topic as text) is null or topic = :topic)
      and (cast(:q as text) is null or question ilike :pattern or topic ilike :pattern)
    order by role, array_position(array['junior','mid','senior'], level), topic, question
    limit :limit offset :offset
    """
)

_TOPICS = text("select distinct topic from public.question_bank order by topic")

_BY_ID = text(
    "select id, role, level, type, topic, question, ideal_points "
    "from public.question_bank where id = :id"
)


def _escape_like(term: str) -> str:
    """Make % and _ in the search text literal (backslash is ILIKE's default escape)."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class QuestionService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def search(
        self,
        *,
        q: str | None,
        role: str | None,
        level: str | None,
        topic: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[QuestionRow], int]:
        term = q.strip() if q else None
        rows = (
            await self._session.execute(
                _SEARCH,
                {
                    "role": role,
                    "level": level,
                    "topic": topic,
                    "q": term or None,
                    "pattern": f"%{_escape_like(term)}%" if term else None,
                    "limit": limit,
                    "offset": offset,
                },
            )
        ).all()
        total = int(rows[0].total) if rows else 0
        return [
            QuestionRow(r.id, r.role, r.level, r.type, r.topic, r.question) for r in rows
        ], total

    async def topics(self) -> list[str]:
        return list((await self._session.execute(_TOPICS)).scalars())

    async def get_with_points(self, question_id: UUID) -> tuple[QuestionRow, list[str]] | None:
        row = (await self._session.execute(_BY_ID, {"id": question_id})).one_or_none()
        if row is None:
            return None
        return QuestionRow(row.id, row.role, row.level, row.type, row.topic, row.question), list(
            row.ideal_points
        )
