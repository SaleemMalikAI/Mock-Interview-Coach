from functools import cache
from pathlib import Path

_DIR = Path(__file__).parent


@cache
def load_prompt(name: str) -> str:
    """Load `app/prompts/<name>.md`. Prompts live in files so they can be reviewed and diffed."""
    return (_DIR / f"{name}.md").read_text(encoding="utf-8")
