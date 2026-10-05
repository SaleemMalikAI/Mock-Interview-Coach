from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StoryIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=120)
    situation: str = Field(default="", max_length=2000)
    task: str = Field(default="", max_length=2000)
    action: str = Field(default="", max_length=3000)
    result: str = Field(default="", max_length=2000)
    tags: list[str] = Field(default_factory=list, max_length=8)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, tags: list[str]) -> list[str]:
        cleaned: list[str] = []
        for tag in tags:
            tag = tag.strip().lower()[:30]
            if tag and tag not in cleaned:
                cleaned.append(tag)
        return cleaned


class StoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    situation: str
    task: str
    action: str
    result: str
    tags: list[str]
    created_at: datetime
    updated_at: datetime
