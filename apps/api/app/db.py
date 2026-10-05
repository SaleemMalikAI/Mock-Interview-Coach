from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings


def to_async_url(url: str) -> str:
    """Supabase gives `postgresql://...`; SQLAlchemy needs the asyncpg driver in the scheme."""
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+asyncpg://" + url.removeprefix(prefix)
    return url


@lru_cache
def get_engine() -> AsyncEngine:
    settings = get_settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set")
    return create_async_engine(
        to_async_url(settings.database_url.get_secret_value()),
        pool_pre_ping=True,
        # Supabase's transaction pooler (port 6543) doesn't support prepared statements
        connect_args={"statement_cache_size": 0, "prepared_statement_cache_size": 0},
    )


@lru_cache
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(get_engine(), expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with get_sessionmaker()() as session:
        yield session
