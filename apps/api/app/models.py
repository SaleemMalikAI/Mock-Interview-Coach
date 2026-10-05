from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, SmallInteger, Text, func, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    # Fetch server defaults (status, created_at) with RETURNING on INSERT instead of
    # separate refresh queries: each DB round trip is expensive over the pooler.
    __mapper_args__ = {"eager_defaults": True}


class Interview(Base):
    """Mirrors public.interviews (schema owned by supabase/migrations)."""

    __tablename__ = "interviews"
    __table_args__ = {"schema": "public"}

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True))
    role: Mapped[str] = mapped_column(Text)
    level: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(Text)
    num_questions: Mapped[int] = mapped_column(SmallInteger)
    job_description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, server_default=text("'setup'"))
    overall_score: Mapped[Decimal | None] = mapped_column(Numeric(4, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class InterviewTurn(Base):
    """Mirrors public.interview_turns. One row per planned question."""

    __tablename__ = "interview_turns"
    __table_args__ = {"schema": "public"}

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    interview_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("public.interviews.id", ondelete="CASCADE")
    )
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True))
    position: Mapped[int] = mapped_column(SmallInteger)
    question: Mapped[str] = mapped_column(Text)
    ideal_points: Mapped[list[str]] = mapped_column(ARRAY(Text))
    source: Mapped[str] = mapped_column(Text)
    question_bank_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    status: Mapped[str] = mapped_column(Text, server_default=text("'pending'"))
    transcript: Mapped[str | None] = mapped_column(Text)
    audio_path: Mapped[str | None] = mapped_column(Text)
    duration_seconds: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    metrics: Mapped[dict | None] = mapped_column(JSONB)
    scores: Mapped[dict | None] = mapped_column(JSONB)
    feedback: Mapped[dict | None] = mapped_column(JSONB)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class StarStory(Base):
    """Mirrors public.star_stories (F13)."""

    __tablename__ = "star_stories"
    __table_args__ = {"schema": "public"}

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True))
    title: Mapped[str] = mapped_column(Text)
    situation: Mapped[str] = mapped_column(Text, default="")
    task: Mapped[str] = mapped_column(Text, default="")
    action: Mapped[str] = mapped_column(Text, default="")
    result: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
