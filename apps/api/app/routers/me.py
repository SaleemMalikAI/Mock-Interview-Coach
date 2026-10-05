from fastapi import APIRouter

from app.auth import CurrentUser, CurrentUserDep

router = APIRouter(tags=["auth"])


@router.get("/me")
async def me(user: CurrentUserDep) -> CurrentUser:
    return user
