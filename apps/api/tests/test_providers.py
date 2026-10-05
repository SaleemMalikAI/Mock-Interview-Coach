from collections.abc import AsyncIterator

import pytest
from pydantic import BaseModel

from app.providers.base import EmbeddingTask, InvalidLLMOutputError, LLMProvider


class Score(BaseModel):
    value: int


class FakeLLM(LLMProvider):
    name = "fake"

    def __init__(self, responses: list[str]) -> None:
        self.responses = responses
        self.calls = 0

    async def generate_text(
        self, prompt: str, *, system: str | None = None, temperature: float = 0.7
    ) -> str:
        return ""

    async def stream_text(
        self, prompt: str, *, system: str | None = None, temperature: float = 0.7
    ) -> AsyncIterator[str]:
        yield ""

    async def _generate_json_raw(
        self, prompt: str, schema: type[BaseModel], *, system: str | None, temperature: float
    ) -> str:
        self.calls += 1
        return self.responses[self.calls - 1]

    async def embed(self, texts: list[str], *, task: EmbeddingTask) -> list[list[float]]:
        return [[0.0] for _ in texts]


async def test_generate_json_returns_valid_model() -> None:
    llm = FakeLLM(['{"value": 7}'])
    assert await llm.generate_json("p", Score) == Score(value=7)
    assert llm.calls == 1


async def test_generate_json_retries_once_on_invalid_json() -> None:
    llm = FakeLLM(["not json", '{"value": 3}'])
    assert await llm.generate_json("p", Score) == Score(value=3)
    assert llm.calls == 2


async def test_generate_json_raises_typed_error_after_two_failures() -> None:
    llm = FakeLLM(["nope", '{"value": "x"}'])
    with pytest.raises(InvalidLLMOutputError):
        await llm.generate_json("p", Score)
    assert llm.calls == 2
