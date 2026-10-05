import time
import uuid
from collections.abc import Iterator
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from httpx import ASGITransport, AsyncClient

from app import auth
from app.main import app

PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())
OTHER_KEY = ec.generate_private_key(ec.SECP256R1())
USER_ID = str(uuid.uuid4())


class FakeSigningKey:
    key = PRIVATE_KEY.public_key()


class FakeJWKSClient:
    def get_signing_key_from_jwt(self, token: str) -> FakeSigningKey:
        jwt.get_unverified_header(token)  # malformed tokens raise like the real client
        return FakeSigningKey()


@pytest.fixture(autouse=True)
def fake_jwks(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.setattr(auth, "get_jwks_client", lambda: FakeJWKSClient())
    yield


def make_token(**overrides: Any) -> str:
    key = overrides.pop("key", PRIVATE_KEY)
    claims = {
        "sub": USER_ID,
        "email": "dev@example.com",
        "aud": "authenticated",
        "iss": auth._issuer(),
        "exp": int(time.time()) + 300,
        **overrides,
    }
    return jwt.encode(claims, key, algorithm="ES256")


async def get_me(headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/me", headers=headers)
    return response.status_code, response.json()


async def test_valid_token_returns_user() -> None:
    status, body = await get_me({"Authorization": f"Bearer {make_token()}"})
    assert status == 200
    assert body == {"id": USER_ID, "email": "dev@example.com"}


async def test_missing_token_is_401() -> None:
    status, body = await get_me({})
    assert status == 401
    assert body["detail"] == "Missing bearer token"


@pytest.mark.parametrize(
    ("token", "detail"),
    [
        (make_token(exp=int(time.time()) - 10), "Token expired"),
        (make_token(aud="anon"), "Invalid token"),
        (make_token(iss="https://evil.example.com/auth/v1"), "Invalid token"),
        (make_token(key=OTHER_KEY), "Invalid token"),
        ("not-a-jwt", "Invalid token"),
    ],
)
async def test_bad_tokens_are_401(token: str, detail: str) -> None:
    status, body = await get_me({"Authorization": f"Bearer {token}"})
    assert status == 401
    assert body["detail"] == detail
