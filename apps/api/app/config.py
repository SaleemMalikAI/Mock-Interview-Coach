from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_version: str = "0.1.0"
    cors_origins: list[str] = ["http://localhost:3000"]
    # Optional regex for extra origins (e.g. Vercel preview URLs). Empty means none.
    cors_origin_regex: str | None = None
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
    groq_stt_model: str = "whisper-large-v3-turbo"
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
    # Public key, used with the caller's own JWT for Storage (RLS applies)
    supabase_publishable_key: str = ""

    # F5 answer upload limits
    answer_max_bytes: int = 10 * 1024 * 1024
    answer_max_seconds: float = 180

    # Database (Supabase Postgres; the pooler connection string)
    database_url: SecretStr | None = None

    @field_validator("cors_origin_regex", mode="before")
    @classmethod
    def empty_regex_is_none(cls, value: object) -> object:
        return None if value == "" else value

    @field_validator("groq_reasoning_effort", mode="before")
    @classmethod
    def empty_effort_is_none(cls, value: object) -> object:
        return None if value == "" else value


@lru_cache
def get_settings() -> Settings:
    return Settings()
