from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_version: str = "0.1.0"
    cors_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    # Provider selection (wired up in Day 2 via providers/base.py)
    stt_provider: str = "groq"
    tts_provider: str = "openai"
    llm_provider: str = "openai"


@lru_cache
def get_settings() -> Settings:
    return Settings()
