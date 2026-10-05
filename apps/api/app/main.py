import asyncio
import logging
import time
import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

import jwt
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.auth import get_jwks_client
from app.config import get_settings
from app.db import get_engine
from app.logging_config import configure_logging, request_id_var
from app.routers import answers, health, interviews, me, questions, stats, stories

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger("app")


async def _warm_up() -> None:
    """Open a pooled DB connection and fetch the auth keys before the first request, so the
    first interview doesn't pay ~5s of connection setup. Failures are logged, never fatal."""
    started = time.perf_counter()
    if settings.database_url:
        try:
            async with get_engine().connect() as conn:
                await conn.execute(text("select 1"))
        except (SQLAlchemyError, OSError) as exc:
            logger.warning("warm-up: database not reachable: %s", exc)
    if settings.supabase_url:
        try:
            await asyncio.to_thread(get_jwks_client().get_signing_keys)
        except jwt.PyJWKClientError as exc:
            logger.warning("warm-up: could not fetch JWKS: %s", exc)
    logger.info("warm-up finished in %.0f ms", (time.perf_counter() - started) * 1000)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await _warm_up()
    yield
    if settings.database_url:
        await get_engine().dispose()


app = FastAPI(title="Mock Interview Coach API", version=settings.app_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    token = request_id_var.set(request_id)
    start = time.perf_counter()
    try:
        response = await call_next(request)
        latency_ms = (time.perf_counter() - start) * 1000
        response.headers["x-request-id"] = request_id
        logger.info(
            "%s %s -> %s (%.1f ms)",
            request.method,
            request.url.path,
            response.status_code,
            latency_ms,
        )
        return response
    finally:
        request_id_var.reset(token)


app.include_router(health.router)
app.include_router(me.router)
app.include_router(interviews.router)
app.include_router(answers.router)
app.include_router(stats.router)
app.include_router(questions.router)
app.include_router(stories.router)
