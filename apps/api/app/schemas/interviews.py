from datetime import datetime
from typing import Literal, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Role = Literal["frontend", "full_stack", "ai_engineer", "behavioral"]
Level = Literal["junior", "mid", "senior"]
InterviewType = Literal["technical", "behavioral", "mixed"]
InterviewStatus = Literal["setup", "in_progress", "completed", "abandoned"]
TurnStatus = Literal["pending", "answered", "skipped", "evaluated"]

JOB_DESCRIPTION_MAX_CHARS = 5000


class InterviewCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Role
    level: Level
    type: InterviewType
    num_questions: Literal[3, 5, 8]
    job_description: str | None = Field(default=None, max_length=JOB_DESCRIPTION_MAX_CHARS)

    @field_validator("job_description", mode="before")
    @classmethod
    def blank_to_none(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @model_validator(mode="after")
    def behavioral_role_is_behavioral(self) -> Self:
        if self.role == "behavioral" and self.type != "behavioral":
            raise ValueError("The behavioral role only supports behavioral interviews")
        return self


class TurnOut(BaseModel):
    """A planned question as the candidate sees it. ideal_points are the grading key, so they
    are never sent to the browser."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    position: int
    question: str
    source: Literal["bank", "jd"]
    status: TurnStatus
    transcript: str | None = None
    duration_seconds: float | None = None


class InterviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: Role
    level: Level
    type: InterviewType
    num_questions: int
    job_description: str | None
    status: InterviewStatus
    overall_score: float | None
    created_at: datetime
    completed_at: datetime | None
    turns: list[TurnOut] = []


class InterviewSummaryOut(BaseModel):
    """One row on the dashboard."""

    id: UUID
    role: Role
    level: Level
    type: InterviewType
    num_questions: int
    status: InterviewStatus
    overall_score: float | None
    answered: int
    created_at: datetime


class PracticeCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question_id: UUID
