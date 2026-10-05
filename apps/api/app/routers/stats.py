from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUserDep
from app.db import get_session
from app.services.stats import StatsService

router = APIRouter(tags=["stats"])


class DayActivityOut(BaseModel):
    day: date
    answers: int
    minutes: float


class StatsOut(BaseModel):
    interviews: int
    completed: int
    answered: int
    average_score: float | None
    best_score: float | None
    current_streak: int
    longest_streak: int
    week_minutes: float
    total_minutes: float
    activity: list[DayActivityOut]


@router.get("/stats")
async def get_stats(
    user: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_session)],
    tz: Annotated[
        str | None, Query(max_length=64, description="IANA timezone, e.g. Asia/Karachi")
    ] = None,
) -> StatsOut:
    stats = await StatsService(session).get(user.id, tz)
    return StatsOut.model_validate(stats, from_attributes=True)
