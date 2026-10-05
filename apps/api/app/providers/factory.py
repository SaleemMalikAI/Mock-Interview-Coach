from functools import lru_cache

from app.config import get_settings
from app.providers.base import LLMProvider, ProviderError, STTProvider, TTSProvider


class ProviderConfigError(ProviderError):
    """The configured provider is unknown, not implemented yet, or missing its API key."""


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    match settings.llm_provider:
        case "gemini":
            if not settings.gemini_api_key:
                raise ProviderConfigError("GEMINI_API_KEY is not set")
            from app.providers.gemini import GeminiLLM

            return GeminiLLM(
                api_key=settings.gemini_api_key.get_secret_value(),
                model=settings.gemini_model,
                embedding_model=settings.gemini_embedding_model,
                embedding_dimensions=settings.embedding_dimensions,
            )
        case other:
            raise ProviderConfigError(f"unknown LLM_PROVIDER: {other!r}")


def get_stt_provider() -> STTProvider:
    # Implemented in F5 (transcription).
    raise ProviderConfigError(f"STT_PROVIDER {get_settings().stt_provider!r} not implemented yet")


def get_tts_provider() -> TTSProvider:
    # Implemented in F4 (interview room TTS).
    raise ProviderConfigError(f"TTS_PROVIDER {get_settings().tts_provider!r} not implemented yet")
