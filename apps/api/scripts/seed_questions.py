"""Seed question_bank from scripts/data/questions.json, with embeddings.

Idempotent: rows are upserted on `question`, so re-running updates them.

    uv run python -m scripts.seed_questions            # embed + upsert
    uv run python -m scripts.seed_questions --dry-run  # validate the JSON only
"""

import argparse
import asyncio
import json
import logging
from collections import Counter
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, TypeAdapter
from sqlalchemy import text

from app.config import get_settings
from app.db import get_engine
from app.providers.factory import get_embedding_provider

DATA_FILE = Path(__file__).parent / "data" / "questions.json"
logger = logging.getLogger("seed_questions")


class SeedQuestion(BaseModel):
    role: Literal["frontend", "full_stack", "ai_engineer", "behavioral"]
    level: Literal["junior", "mid", "senior"]
    type: Literal["technical", "behavioral"]
    topic: str = Field(min_length=1)
    question: str = Field(min_length=10)
    ideal_points: list[str] = Field(min_length=3, max_length=5)


def load_questions() -> list[SeedQuestion]:
    questions = TypeAdapter(list[SeedQuestion]).validate_json(DATA_FILE.read_bytes())
    duplicates = [q for q, n in Counter(q.question for q in questions).items() if n > 1]
    if duplicates:
        raise ValueError(f"duplicate questions: {duplicates}")
    return questions


def embedding_text(q: SeedQuestion) -> str:
    # Include the topic and ideal points so JD similarity matches on skills, not just wording.
    return f"{q.topic}: {q.question}\n" + "\n".join(q.ideal_points)


UPSERT_SQL = text(
    """
    insert into public.question_bank (role, level, type, topic, question, ideal_points, embedding)
    values (:role, :level, :type, :topic, :question, :ideal_points,
            cast(:embedding as extensions.vector))
    on conflict (question) do update set
      role = excluded.role,
      level = excluded.level,
      type = excluded.type,
      topic = excluded.topic,
      ideal_points = excluded.ideal_points,
      embedding = excluded.embedding
    """
)


async def seed(dry_run: bool) -> None:
    questions = load_questions()
    counts = Counter((q.role, q.level) for q in questions)
    logger.info("loaded %d questions: %s", len(questions), dict(sorted(counts.items())))
    if dry_run:
        return

    embedder = get_embedding_provider()
    vectors = await embedder.embed([embedding_text(q) for q in questions], task="document")
    expected_dim = get_settings().embedding_dimensions
    if any(len(v) != expected_dim for v in vectors):
        raise ValueError(f"embedding size mismatch, expected {expected_dim}")

    rows = [
        {**q.model_dump(), "embedding": json.dumps(vector)}
        for q, vector in zip(questions, vectors, strict=True)
    ]
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.execute(UPSERT_SQL, rows)
        total = (await conn.execute(text("select count(*) from public.question_bank"))).scalar()
    await engine.dispose()
    logger.info("upserted %d questions (question_bank now has %s rows)", len(rows), total)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="validate the data file only")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    asyncio.run(seed(args.dry_run))


if __name__ == "__main__":
    main()
