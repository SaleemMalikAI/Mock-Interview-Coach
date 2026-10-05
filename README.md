# Mock Interview Coach

Voice-first AI mock interviewer: pick a role, answer questions out loud, and get scored feedback plus speech metrics.

> 🚧 Work in progress. See [`docs/PRD.md`](docs/PRD.md) for the spec and [`docs/PROGRESS.md`](docs/PROGRESS.md) for status.

## Stack
- **Web:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui (`apps/web`)
- **API:** FastAPI, Python 3.12, uv (`apps/api`)
- **Data:** Supabase (Postgres + pgvector, Auth, Storage)

## Local setup

### One command (Docker)
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up --build      # web → http://localhost:3000, api → http://localhost:8000/docs
```
Both apps hot-reload when you edit files. Stop with `Ctrl+C` or `docker compose down`.
If you add a dependency, rebuild: `docker compose up --build -V`.

### Without Docker
```bash
# API → http://localhost:8000/docs
cd apps/api && cp .env.example .env && uv sync && uv run uvicorn app.main:app --reload

# Web → http://localhost:3000
cd apps/web && cp .env.example .env.local && pnpm install && pnpm dev
```

## Checks
```bash
cd apps/web && pnpm lint && pnpm typecheck
cd apps/api && uv run ruff check . && uv run pytest -q
```
