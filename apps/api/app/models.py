from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import DateTime, Numeric, SmallInteger, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Interview(Base):
    """Mirrors public.interviews (schema owned by supabase/migrations)."""

    __tablename__ = "interviews"
    __table_args__ = {"schema": "public"}

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
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
