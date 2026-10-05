"""Provider interfaces for STT, TTS and LLM.

Vendor SDKs are only imported inside `app/providers/`. Everything else depends on these
interfaces and gets a concrete provider from `app.providers.factory`.
"""

import logging
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

EmbeddingTask = Literal["document", "query"]


class ProviderError(Exception):
    """A vendor call failed (network, auth, quota, bad response)."""


class InvalidLLMOutputError(ProviderError):
    """The LLM returned output that failed validation, even after one retry."""


@dataclass(frozen=True, slots=True)
class Transcript:
    text: str
    duration_seconds: float | None = None


@dataclass(frozen=True, slots=True)
class SynthesizedAudio:
    data: bytes
    mime_type: str


class LLMProvider(ABC):
    name: str

    @abstractmethod
    async def generate_text(
        self, prompt: str, *, system: str | None = None, temperature: float = 0.7
    ) -> str: ...

    @abstractmethod
    def stream_text(
        self, prompt: str, *, system: str | None = None, temperature: float = 0.7
    ) -> AsyncIterator[str]: ...

    @abstractmethod
    async def _generate_json_raw(
        self,
        prompt: str,
        schema: type[BaseModel],
        *,
        system: str | None,
        temperature: float,
    ) -> str:
        """Return the raw JSON text the model produced for `schema`."""

    async def generate_json[T: BaseModel](
        self,
        prompt: str,
        schema: type[T],
        *,
        system: str | None = None,
        temperature: float = 0.2,
    ) -> T:
        """Generate structured output validated by `schema`. Retries once on invalid JSON."""
        last_error: ValidationError | None = None
        for attempt in (1, 2):
            raw = await self._generate_json_raw(
                prompt, schema, system=system, temperature=temperature
            )
            try:
                return schema.model_validate_json(raw)
            except ValidationError as exc:
                last_error = exc
                logger.warning(
                    "invalid JSON from %s for %s (attempt %d): %s",
                    self.name,
                    schema.__name__,
                    attempt,
                    exc.error_count(),
                )
        raise InvalidLLMOutputError(
            f"{self.name} returned invalid {schema.__name__} twice"
        ) from last_error


class EmbeddingProvider(ABC):
    """Separate from LLMProvider: vectors in question_bank must all come from the same model,
    so the embedding vendor can stay fixed while the LLM vendor changes."""

    name: str

    @abstractmethod
    async def embed(self, texts: list[str], *, task: EmbeddingTask) -> list[list[float]]: ...


class STTProvider(ABC):
    name: str

    @abstractmethod
    async def transcribe(self, audio: bytes, *, mime_type: str) -> Transcript: ...


class TTSProvider(ABC):
    name: str

    @abstractmethod
    async def synthesize(self, text: str) -> SynthesizedAudio: ...
