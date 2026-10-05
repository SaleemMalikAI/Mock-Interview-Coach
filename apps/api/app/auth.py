"""Verify Supabase access tokens (asymmetric signing keys, published as JWKS)."""

import asyncio
import logging
from functools import lru_cache
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)
_ALGORITHMS = ["ES256", "RS256"]
_AUDIENCE = "authenticated"


class CurrentUser(BaseModel):
    id: UUID
    email: str | None = None


def _issuer() -> str:
    return f"{get_settings().supabase_url.rstrip('/')}/auth/v1"


@lru_cache
def get_jwks_client() -> jwt.PyJWKClient:
    # Keys are cached in memory; a new `kid` (key rotation) triggers a refetch.
    return jwt.PyJWKClient(f"{_issuer()}/.well-known/jwks.json", cache_keys=True, lifespan=600)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> CurrentUser:
    if credentials is None:
        raise _unauthorized("Missing bearer token")
    token = credentials.credentials
    try:
        # PyJWKClient does blocking HTTP on a cache miss.
        signing_key = await asyncio.to_thread(get_jwks_client().get_signing_key_from_jwt, token)
    except jwt.PyJWKClientConnectionError as exc:
        logger.error("could not fetch Supabase JWKS: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Auth keys unavailable"
        ) from exc
    except jwt.PyJWTError as exc:
        raise _unauthorized("Invalid token") from exc

    try:
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=_ALGORITHMS,
            audience=_AUDIENCE,
            issuer=_issuer(),
        )
    except jwt.ExpiredSignatureError as exc:
        raise _unauthorized("Token expired") from exc
    except jwt.PyJWTError as exc:
        raise _unauthorized("Invalid token") from exc

    return CurrentUser(id=claims["sub"], email=claims.get("email"))


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
