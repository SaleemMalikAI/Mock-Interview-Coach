import pytest
from pydantic import ValidationError

from app.schemas.stories import StoryIn


def test_tags_are_cleaned_and_deduplicated() -> None:
    story = StoryIn(
        title="  Migrated billing  ", tags=[" Leadership", "leadership", "", "Incidents"]
    )
    assert story.title == "Migrated billing"
    assert story.tags == ["leadership", "incidents"]


@pytest.mark.parametrize(
    "payload",
    [
        {"title": ""},
        {"title": "x" * 121},
        {"title": "ok", "action": "x" * 3001},
        {"title": "ok", "tags": [f"t{i}" for i in range(9)]},
        {"title": "ok", "user_id": "someone-else"},
    ],
)
def test_invalid_stories_are_rejected(payload: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        StoryIn.model_validate(payload)
