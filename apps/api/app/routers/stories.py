from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUserDep
from app.db import get_session
from app.schemas.stories import StoryIn, StoryOut
from app.services.stories import StoryLimitError, StoryService

router = APIRouter(prefix="/stories", tags=["stories"])


def get_story_service(session: Annotated[AsyncSession, Depends(get_session)]) -> StoryService:
    return StoryService(session)


ServiceDep = Annotated[StoryService, Depends(get_story_service)]


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")


@router.get("")
async def list_stories(user: CurrentUserDep, service: ServiceDep) -> list[StoryOut]:
    return [StoryOut.model_validate(s) for s in await service.list(user.id)]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_story(body: StoryIn, user: CurrentUserDep, service: ServiceDep) -> StoryOut:
    try:
        return StoryOut.model_validate(await service.create(user.id, body))
    except StoryLimitError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.put("/{story_id}")
async def update_story(
    story_id: UUID, body: StoryIn, user: CurrentUserDep, service: ServiceDep
) -> StoryOut:
    story = await service.update(user.id, story_id, body)
    if story is None:
        raise _not_found()
    return StoryOut.model_validate(story)


@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_story(story_id: UUID, user: CurrentUserDep, service: ServiceDep) -> Response:
    if not await service.delete(user.id, story_id):
        raise _not_found()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
