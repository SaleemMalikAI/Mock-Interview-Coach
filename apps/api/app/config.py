from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_version: str = "0.1.0"
    cors_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    # Provider selection (see app/providers/factory.py)
    stt_provider: str = "gemini"
    tts_provider: str = "gemini"
    llm_provider: str = "gemini"

    # Gemini
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-3.8-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    # Must match the vector(768) column in question_bank
    embedding_dimensions: int = 768

    # Database (Supabase Postgres; the pooler connection string)
    database_url: SecretStr | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
