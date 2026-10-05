from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_version: str = "0.1.0"
    cors_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    # Provider selection (see app/providers/factory.py)
    llm_provider: str = "groq"
    stt_provider: str = "groq"
    tts_provider: str = "groq"
    # Keep fixed: changing it means re-running scripts/seed_questions.py
    embedding_provider: str = "gemini"

    # Groq (LLM, STT, TTS)
    groq_api_key: SecretStr | None = None
    groq_model: str = "openai/gpt-oss-120b"
    # For reasoning models (gpt-oss, qwen3). "low" cuts JD question generation from ~3s to ~1.3s.
    # Leave empty for non-reasoning models, which reject the parameter.
    groq_reasoning_effort: Literal["low", "medium", "high"] | None = "low"

    # Gemini (embeddings; LLM if LLM_PROVIDER=gemini)
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-3.8-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    # Must match the vector(768) column in question_bank
    embedding_dimensions: int = 768

    # F3: give up on JD-generated questions after this long and use bank questions instead,
    # so planning stays under the 5 s budget when the LLM has a slow moment.
    jd_generation_timeout_seconds: float = 3.5

    # Supabase project URL; access tokens are verified against its JWKS
    supabase_url: str = ""

    # Database (Supabase Postgres; the pooler connection string)
    database_url: SecretStr | None = None

    @field_validator("groq_reasoning_effort", mode="before")
    @classmethod
    def empty_effort_is_none(cls, value: object) -> object:
        return None if value == "" else value


@lru_cache
def get_settings() -> Settings:
    return Settings()
