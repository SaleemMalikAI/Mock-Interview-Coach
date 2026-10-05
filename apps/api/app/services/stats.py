"""F11: practice stats for the dashboard (streak, weekly minutes, activity)."""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

ACTIVITY_DAYS = 14

_DAILY = text(
    """
    select (answered_at at time zone :tz)::date as day,
           count(*) as answers,
           coalesce(sum(duration_seconds), 0)::float8 as seconds
    from public.interview_turns
    where user_id = :user_id and answered_at is not null
      and answered_at > now() - interval '400 days'
    group by 1
    order by 1
    """
)

_TOTALS = text(
    """
    select count(*) as interviews,
           count(*) filter (where status = 'completed') as completed,
           avg(overall_score)::float8 as average_score,
           max(overall_score)::float8 as best_score
    from public.interviews
    where user_id = :user_id
    """
)


@dataclass(frozen=True, slots=True)
class DayActivity:
    day: date
    answers: int
    minutes: float


@dataclass(frozen=True, slots=True)
class Stats:
    interviews: int
    completed: int
    answered: int
    average_score: float | None
    best_score: float | None
    current_streak: int
    longest_streak: int
    week_minutes: float
    total_minutes: float
    activity: list[DayActivity]


def resolve_timezone(name: str | None) -> str:
    """Accept only real IANA names; anything else falls back to UTC."""
    if not name:
        return "UTC"
    try:
        ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError):
        return "UTC"
    return name


def streaks(days: set[date], today: date) -> tuple[int, int]:
    """Current streak counts back from today, or from yesterday if today has no practice yet."""
    current = 0
    cursor = today if today in days else today - timedelta(days=1)
    while cursor in days:
        current += 1
        cursor -= timedelta(days=1)
    longest = run = 0
    previous: date | None = None
    for day in sorted(days):
        run = run + 1 if previous is not None and day - previous == timedelta(days=1) else 1
        longest = max(longest, run)
        previous = day
    return current, longest


class StatsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, user_id: UUID, timezone: str | None, now: datetime | None = None) -> Stats:
        tz = resolve_timezone(timezone)
        today = (now or datetime.now(ZoneInfo(tz))).astimezone(ZoneInfo(tz)).date()
        daily_rows = (await self._session.execute(_DAILY, {"user_id": user_id, "tz": tz})).all()
        totals = (await self._session.execute(_TOTALS, {"user_id": user_id})).one()

        by_day = {row.day: (int(row.answers), float(row.seconds)) for row in daily_rows}
        current, longest = streaks(set(by_day), today)
        week_start = today - timedelta(days=6)
        activity = [
            DayActivity(
                day=day,
                answers=by_day.get(day, (0, 0.0))[0],
                minutes=round(by_day.get(day, (0, 0.0))[1] / 60, 1),
            )
            for day in (
                today - timedelta(days=offset) for offset in range(ACTIVITY_DAYS - 1, -1, -1)
            )
        ]
        return Stats(
            interviews=int(totals.interviews),
            completed=int(totals.completed),
            answered=sum(answers for answers, _ in by_day.values()),
            average_score=round(totals.average_score, 1)
            if totals.average_score is not None
            else None,
            best_score=totals.best_score,
            current_streak=current,
            longest_streak=longest,
            week_minutes=round(sum(s for d, (_, s) in by_day.items() if d >= week_start) / 60, 1),
            total_minutes=round(sum(s for _, s in by_day.values()) / 60, 1),
            activity=activity,
        )
