from datetime import date, timedelta

import pytest

from app.services.stats import resolve_timezone, streaks

TODAY = date(2026, 10, 5)


def days(*offsets: int) -> set[date]:
    return {TODAY - timedelta(days=o) for o in offsets}


@pytest.mark.parametrize(
    ("practiced", "expected"),
    [
        (set(), (0, 0)),
        (days(0), (1, 1)),
        (days(1), (1, 1)),  # yesterday still counts until today ends
        (days(2), (0, 1)),
        (days(0, 1, 2), (3, 3)),
        (days(1, 2, 3, 10, 11, 12, 13, 14), (3, 5)),
        (days(0, 2, 3), (1, 2)),
    ],
)
def test_streaks(practiced: set[date], expected: tuple[int, int]) -> None:
    assert streaks(practiced, TODAY) == expected


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("Asia/Karachi", "Asia/Karachi"),
        (None, "UTC"),
        ("", "UTC"),
        ("Not/AZone", "UTC"),
        ("'; drop table x; --", "UTC"),
    ],
)
def test_resolve_timezone(name: str | None, expected: str) -> None:
    assert resolve_timezone(name) == expected
