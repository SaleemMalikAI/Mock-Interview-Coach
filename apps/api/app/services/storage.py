import logging

import httpx

logger = logging.getLogger(__name__)


class StorageError(Exception):
    """Uploading to Supabase Storage failed."""


class SupabaseStorage:
    """Minimal Supabase Storage client. Requests carry the end user's JWT, so the bucket's RLS
    policies decide what is allowed; the API never needs a service-role key for this."""

    def __init__(self, *, url: str, publishable_key: str, timeout: float = 15) -> None:
        self._base = f"{url.rstrip('/')}/storage/v1"
        self._publishable_key = publishable_key
        self._timeout = timeout

    async def upload(
        self, *, bucket: str, path: str, data: bytes, content_type: str, user_token: str
    ) -> None:
        headers = {
            "apikey": self._publishable_key,
            "Authorization": f"Bearer {user_token}",
            "Content-Type": content_type,
            "x-upsert": "true",  # re-recording replaces the previous answer
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    f"{self._base}/object/{bucket}/{path}", content=data, headers=headers
                )
        except httpx.HTTPError as exc:
            raise StorageError(f"storage upload failed: {exc}") from exc
        if response.status_code >= 400:
            logger.warning("storage upload %s -> %s: %s", path, response.status_code, response.text)
            raise StorageError(f"storage upload failed with {response.status_code}")

    async def delete(self, *, bucket: str, path: str, user_token: str) -> None:
        """Best effort: used to clean up after a rejected answer. Never raises."""
        headers = {"apikey": self._publishable_key, "Authorization": f"Bearer {user_token}"}
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.delete(
                    f"{self._base}/object/{bucket}/{path}", headers=headers
                )
            if response.status_code >= 400:
                logger.warning("storage delete %s -> %s", path, response.status_code)
        except httpx.HTTPError as exc:
            logger.warning("storage delete %s failed: %s", path, exc)
