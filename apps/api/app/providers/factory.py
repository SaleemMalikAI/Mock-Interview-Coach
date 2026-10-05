from functools import lru_cache

from pydantic import SecretStr

from app.config import get_settings
from app.providers.base import (
    EmbeddingProvider,
    LLMProvider,
    ProviderError,
    STTProvider,
    TTSProvider,
)


class ProviderConfigError(ProviderError):
    """The configured provider is unknown, not implemented yet, or missing its API key."""


def _secret(value: SecretStr | None, env_name: str) -> str:
    if value is None or not value.get_secret_value():
        raise ProviderConfigError(f"{env_name} is not set")
    return value.get_secret_value()


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    match settings.llm_provider:
        case "groq":
            from app.providers.groq import GroqLLM

            return GroqLLM(
                api_key=_secret(settings.groq_api_key, "GROQ_API_KEY"),
                model=settings.groq_model,
                reasoning_effort=settings.groq_reasoning_effort,
            )
        case "gemini":
            from app.providers.gemini import GeminiLLM

            return GeminiLLM(
                api_key=_secret(settings.gemini_api_key, "GEMINI_API_KEY"),
                model=settings.gemini_model,
            )
        case other:
            raise ProviderConfigError(f"unknown LLM_PROVIDER: {other!r}")


@lru_cache
def get_embedding_provider() -> EmbeddingProvider:
    settings = get_settings()
    match settings.embedding_provider:
        case "gemini":
            from app.providers.gemini import GeminiEmbeddings

            return GeminiEmbeddings(
                api_key=_secret(settings.gemini_api_key, "GEMINI_API_KEY"),
                model=settings.gemini_embedding_model,
                dimensions=settings.embedding_dimensions,
            )
        case other:
            raise ProviderConfigError(f"unknown EMBEDDING_PROVIDER: {other!r}")


@lru_cache
def get_stt_provider() -> STTProvider:
    settings = get_settings()
    match settings.stt_provider:
        case "groq":
            from app.providers.groq import GroqSTT

            return GroqSTT(
                api_key=_secret(settings.groq_api_key, "GROQ_API_KEY"),
                model=settings.groq_stt_model,
            )
        case other:
            raise ProviderConfigError(f"unknown STT_PROVIDER: {other!r}")


def get_tts_provider() -> TTSProvider:
    # Implemented in F4 (interview room TTS).
    raise ProviderConfigError(f"TTS_PROVIDER {get_settings().tts_provider!r} not implemented yet")
