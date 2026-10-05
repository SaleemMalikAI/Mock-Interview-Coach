from collections import Counter

from scripts.seed_questions import load_questions


def test_seed_file_has_25_questions_per_role_across_levels() -> None:
    questions = load_questions()
    by_role = Counter(q.role for q in questions)
    assert by_role == {"frontend": 25, "full_stack": 25, "ai_engineer": 25, "behavioral": 25}
    for role in by_role:
        levels = {q.level for q in questions if q.role == role}
        assert levels == {"junior", "mid", "senior"}


def test_behavioral_role_uses_behavioral_type() -> None:
    for q in load_questions():
        assert (q.type == "behavioral") == (q.role == "behavioral")
