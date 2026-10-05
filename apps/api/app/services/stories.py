"""F13: STAR story bank CRUD. Always scoped by user_id (the API bypasses RLS)."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import StarStory
from app.schemas.stories import StoryIn

MAX_STORIES = 50


class StoryLimitError(Exception):
    pass


class StoryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list(self, user_id: UUID) -> list[StarStory]:
        result = await self._session.execute(
            select(StarStory)
            .where(StarStory.user_id == user_id)
            .order_by(StarStory.updated_at.desc())
        )
        return list(result.scalars())

    async def create(self, user_id: UUID, data: StoryIn) -> StarStory:
        count = len(await self.list(user_id))
        if count >= MAX_STORIES:
            raise StoryLimitError(f"You can save up to {MAX_STORIES} stories.")
        story = StarStory(user_id=user_id, **data.model_dump())
        self._session.add(story)
        await self._session.commit()
        return story

    async def update(self, user_id: UUID, story_id: UUID, data: StoryIn) -> StarStory | None:
        story = await self._get(user_id, story_id)
        if story is None:
            return None
        for field, value in data.model_dump().items():
            setattr(story, field, value)
        await self._session.commit()
        await self._session.refresh(story)
        return story

    async def delete(self, user_id: UUID, story_id: UUID) -> bool:
        story = await self._get(user_id, story_id)
        if story is None:
            return False
        await self._session.delete(story)
        await self._session.commit()
        return True

    async def _get(self, user_id: UUID, story_id: UUID) -> StarStory | None:
        result = await self._session.execute(
            select(StarStory).where(StarStory.id == story_id, StarStory.user_id == user_id)
        )
        return result.scalar_one_or_none()
