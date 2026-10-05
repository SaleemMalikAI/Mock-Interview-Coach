from collections.abc import AsyncIterator
from typing import Any, Literal

from groq import APIError, AsyncGroq
from groq.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel

from app.providers.base import LLMProvider, ProviderError


def _messages(prompt: str, system: str | None) -> list[ChatCompletionMessageParam]:
    messages: list[ChatCompletionMessageParam] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    return messages


class GroqLLM(LLMProvider):
    name = "groq"

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        reasoning_effort: Literal["low", "medium", "high"] | None = None,
    ) -> None:
        # The SDK retries 429s and 5xx itself (max_retries).
        self._client = AsyncGroq(api_key=api_key, max_retries=2)
        self._model = model
        self._extra: dict[str, Any] = (
            {"reasoning_effort": reasoning_effort} if reasoning_effort else {}
        )

    async def generate_text(
        self, prompt: str, *, system: str | None = None, temperature: float = 0.7
    ) -> str:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=_messages(prompt, system),
                temperature=temperature,
                **self._extra,
            )
        except APIError as exc:
            raise ProviderError(f"groq chat completion failed: {exc}") from exc
        return response.choices[0].message.content or ""

    async def stream_text(
        self, prompt: str, *, system: str | None = None, temperature: float = 0.7
    ) -> AsyncIterator[str]:
        try:
            stream = await self._client.chat.completions.create(
                model=self._model,
                messages=_messages(prompt, system),
                temperature=temperature,
                stream=True,
                **self._extra,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if delta:
                    yield delta
        except APIError as exc:
            raise ProviderError(f"groq stream failed: {exc}") from exc

    async def _generate_json_raw(
        self,
        prompt: str,
        schema: type[BaseModel],
        *,
        system: str | None,
        temperature: float,
    ) -> str:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=_messages(prompt, system),
                temperature=temperature,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": schema.__name__,
                        "schema": schema.model_json_schema(),
                    },
                },
                **self._extra,
            )
        except APIError as exc:
            raise ProviderError(f"groq chat completion (json) failed: {exc}") from exc
        return response.choices[0].message.content or ""
