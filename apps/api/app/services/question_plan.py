"""F3: build the question plan for an interview.

Bank questions are picked by role, level (nearest level first) and similarity to the job
description; 1-2 extra questions are generated from the JD. Any provider failure degrades to
bank-only questions so an interview can always start.
"""

import asyncio
import logging
import re
import time
from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.prompts import load_prompt
from app.providers.base import EmbeddingProvider, LLMProvider, ProviderError
from app.schemas.interviews import InterviewCreate
from app.services.question_bank import BankQuestion, QuestionBankRepository

logger = logging.getLogger(__name__)

_LEVEL_ORDER = ["junior", "mid", "senior"]
_ROLE_LABELS = {
    "frontend": "Frontend",
    "full_stack": "Full Stack",
    "ai_engineer": "AI Engineer",
    "behavioral": "Behavioral",
}
_JD_TAG = re.compile(r"</?\s*job_description\s*>", re.IGNORECASE)


@dataclass(frozen=True, slots=True)
class PlannedQuestion:
    question: str
    ideal_points: list[str]
    source: Literal["bank", "jd"]
    question_bank_id: UUID | None = None


class GeneratedQuestion(BaseModel):
    question: str = Field(min_length=10, max_length=500)
    ideal_points: list[str] = Field(min_length=3, max_length=5)


class GeneratedQuestions(BaseModel):
    questions: list[GeneratedQuestion]


@dataclass(frozen=True, slots=True)
class _Allocation:
    jd: int
    primary: int  # from the role's own bank (or the behavioral bank for behavioral interviews)
    behavioral: int  # extra behavioral questions for mixed interviews
    primary_role: str


def allocate(settings: InterviewCreate) -> _Allocation:
    total = settings.num_questions
    jd = 0 if not settings.job_description else (1 if total == 3 else 2)
    if settings.role == "behavioral" or settings.type == "behavioral":
        return _Allocation(jd=jd, primary=total - jd, behavioral=0, primary_role="behavioral")
    behavioral = total // 3 if settings.type == "mixed" else 0
    return _Allocation(
        jd=jd, primary=total - jd - behavioral, behavioral=behavioral, primary_role=settings.role
    )


def level_distance(level: str, target: str) -> int:
    return abs(_LEVEL_ORDER.index(level) - _LEVEL_ORDER.index(target))


def pick(
    candidates: list[BankQuestion], *, level: str, count: int, exclude: set[UUID]
) -> list[BankQuestion]:
    """Use the requested level first and only move to further levels when it runs out.
    Within each level, prefer topics not used yet; candidate order (JD similarity or a
    shuffle) breaks ties."""
    pool = [c for c in candidates if c.id not in exclude]
    chosen: list[BankQuestion] = []
    topics: set[str] = set()
    for distance in sorted({level_distance(c.level, level) for c in pool}):
        remaining = [c for c in pool if level_distance(c.level, level) == distance]
        while remaining and len(chosen) < count:
            candidate = next((c for c in remaining if c.topic not in topics), remaining[0])
            remaining.remove(candidate)
            chosen.append(candidate)
            topics.add(candidate.topic)
    return chosen


def normalize(question: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", question.lower()).strip()


def sanitize_job_description(job_description: str) -> str:
    """Strip our delimiter tags so the JD can't close the <job_description> block early."""
    return _JD_TAG.sub("", job_description).strip()


class QuestionPlanner:
    def __init__(
        self,
        bank: QuestionBankRepository,
        embedder: EmbeddingProvider,
        llm: LLMProvider,
        *,
        generation_timeout: float = 3.5,
    ) -> None:
        self._bank = bank
        self._embedder = embedder
        self._llm = llm
        self._generation_timeout = generation_timeout

    async def build(self, settings: InterviewCreate) -> list[PlannedQuestion]:
        started = time.perf_counter()
        allocation = allocate(settings)
        query = await self._embed_job_description(settings.job_description)
        embedded = time.perf_counter()

        roles = [allocation.primary_role] + (["behavioral"] if allocation.behavioral else [])
        candidates = await self._bank.candidates(roles, query)  # one round trip for both pools
        primary_pool = [c for c in candidates if c.role == allocation.primary_role]
        primary = pick(primary_pool, level=settings.level, count=allocation.primary, exclude=set())
        behavioral: list[BankQuestion] = []
        if allocation.behavioral:
            behavioral_pool = [c for c in candidates if c.role == "behavioral"]
            behavioral = pick(
                behavioral_pool, level=settings.level, count=allocation.behavioral, exclude=set()
            )

        bank_picks = primary + behavioral
        fetched = time.perf_counter()
        generated: list[GeneratedQuestion] = []
        if allocation.jd and settings.job_description:
            generated = await self._generate_from_job_description(
                settings,
                settings.job_description,
                allocation.jd,
                [q.question for q in bank_picks],
            )

        # Drop generated questions that duplicate a bank pick (or each other), then backfill.
        seen = {normalize(q.question) for q in bank_picks}
        jd_questions: list[GeneratedQuestion] = []
        for question in generated:
            key = normalize(question.question)
            if key not in seen:
                seen.add(key)
                jd_questions.append(question)
        missing = allocation.jd - len(jd_questions)
        if missing > 0:
            primary += pick(
                primary_pool,
                level=settings.level,
                count=missing,
                exclude={q.id for q in bank_picks},
            )

        plan = self._order(primary, jd_questions, behavioral)
        done = time.perf_counter()
        logger.info(
            "question plan: %d questions (%d from JD) in %.0f ms "
            "(embed %.0f, bank %.0f, generate %.0f)",
            len(plan),
            len(jd_questions),
            (done - started) * 1000,
            (embedded - started) * 1000,
            (fetched - embedded) * 1000,
            (done - fetched) * 1000,
        )
        return plan

    @staticmethod
    def _order(
        primary: list[BankQuestion],
        jd_questions: list[GeneratedQuestion],
        behavioral: list[BankQuestion],
    ) -> list[PlannedQuestion]:
        """Warm up with one bank question, then the JD-specific ones, then the rest."""
        bank = [
            PlannedQuestion(q.question, q.ideal_points, "bank", q.id) for q in primary + behavioral
        ]
        generated = [PlannedQuestion(q.question, q.ideal_points, "jd") for q in jd_questions]
        return bank[:1] + generated + bank[1:]

    async def _embed_job_description(self, job_description: str | None) -> list[float] | None:
        if not job_description:
            return None
        try:
            [vector] = await self._embedder.embed([job_description], task="query")
        except ProviderError as exc:
            logger.warning("JD embedding failed, falling back to random bank order: %s", exc)
            return None
        return vector

    async def _generate_from_job_description(
        self, settings: InterviewCreate, job_description: str, count: int, planned: list[str]
    ) -> list[GeneratedQuestion]:
        prompt = load_prompt("jd_questions_user").format(
            role=_ROLE_LABELS[settings.role],
            level=settings.level,
            interview_type=settings.type,
            count=count,
            planned="\n".join(f"- {q}" for q in planned) or "- (none)",
            job_description=sanitize_job_description(job_description),
        )
        try:
            result = await asyncio.wait_for(
                self._llm.generate_json(
                    prompt,
                    GeneratedQuestions,
                    system=load_prompt("jd_questions_system"),
                    temperature=0.4,
                ),
                timeout=self._generation_timeout,
            )
        except ProviderError as exc:
            logger.warning("JD question generation failed, using bank questions: %s", exc)
            return []
        except TimeoutError:
            logger.warning(
                "JD question generation took over %.1fs, using bank questions",
                self._generation_timeout,
            )
            return []
        return result.questions[:count]
