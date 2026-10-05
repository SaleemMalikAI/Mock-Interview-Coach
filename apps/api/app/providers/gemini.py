from collections.abc import AsyncIterator

from google import genai
from google.genai import errors, types
from pydantic import BaseModel

from app.providers.base import EmbeddingTask, LLMProvider, ProviderError

_TASK_TYPES: dict[EmbeddingTask, str] = {
    "document": "RETRIEVAL_DOCUMENT",
    "query": "RETRIEVAL_QUERY",
}
# The embed endpoint accepts at most 100 inputs per request.
_EMBED_BATCH_SIZE = 100


class GeminiLLM(LLMProvider):
    name = "gemini"

    def __init__(
        self, *, api_key: str, model: str, embedding_model: str, embedding_dimensions: int
    ) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model
        self._embedding_model = embedding_model
        self._embedding_dimensions = embedding_dimensions

    def _config(self, system: str | None, temperature: float) -> types.GenerateContentConfig:
        return types.GenerateContentConfig(
            system_instruction=system,
            temperature=temperature,
            # We never pass tools, so skip the SDK's automatic function-calling loop.
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )

    async def generate_text(
        self, prompt: str, *, system: str | None = None, temperature: float = 0.7
    ) -> str:
        try:
            response = await self._client.aio.models.generate_content(
                model=self._model, contents=prompt, config=self._config(system, temperature)
            )
        except errors.APIError as exc:
            raise ProviderError(f"gemini generate_content failed: {exc}") from exc
        return response.text or ""

    async def stream_text(
        self, prompt: str, *, system: str | None = None, temperature: float = 0.7
    ) -> AsyncIterator[str]:
        try:
            stream = await self._client.aio.models.generate_content_stream(
                model=self._model, contents=prompt, config=self._config(system, temperature)
            )
            async for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except errors.APIError as exc:
            raise ProviderError(f"gemini stream failed: {exc}") from exc

    async def _generate_json_raw(
        self,
        prompt: str,
        schema: type[BaseModel],
        *,
        system: str | None,
        temperature: float,
    ) -> str:
        config = self._config(system, temperature)
        config.response_mime_type = "application/json"
        config.response_json_schema = schema.model_json_schema()
        try:
            response = await self._client.aio.models.generate_content(
                model=self._model, contents=prompt, config=config
            )
        except errors.APIError as exc:
            raise ProviderError(f"gemini generate_content (json) failed: {exc}") from exc
        return response.text or ""

    async def embed(self, texts: list[str], *, task: EmbeddingTask) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), _EMBED_BATCH_SIZE):
            batch = texts[start : start + _EMBED_BATCH_SIZE]
            try:
                response = await self._client.aio.models.embed_content(
                    model=self._embedding_model,
                    contents=batch,
                    config=types.EmbedContentConfig(
                        task_type=_TASK_TYPES[task],
                        output_dimensionality=self._embedding_dimensions,
                    ),
                )
            except errors.APIError as exc:
                raise ProviderError(f"gemini embed_content failed: {exc}") from exc
            embeddings = response.embeddings or []
            if len(embeddings) != len(batch):
                raise ProviderError(
                    f"gemini returned {len(embeddings)} embeddings for {len(batch)} inputs"
                )
            vectors.extend(list(e.values or []) for e in embeddings)
        return vectors
