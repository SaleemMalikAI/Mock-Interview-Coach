# Progress Log

Claude updates this at the end of every feature. Newest entry on top.

| Feature | Status | Notes |
|---|---|---|
| F1 Auth | ⬜ | |
| F2 Interview setup | ⬜ | |
| F3 Question plan (RAG) | ⬜ | |
| F4 Interview room | ⬜ | |
| F5 Transcription | ⬜ | |
| F6 Speech metrics | ⬜ | |
| F7 Answer evaluation | ⬜ | |
| F8 Final report | ⬜ | |
| F9 Dashboard | ⬜ | |
| F10 Limits & polish | ⬜ | |

Status: ⬜ not started · 🟨 in progress · ✅ done

## Decisions
- Next.js 16.3 (create-next-app latest) instead of 15. It satisfies the "15+" rule. Its breaking-change docs ship in `apps/web/node_modules/next/dist/docs/` (see `apps/web/AGENTS.md`).
- The API is a uv app (`package = false`), not a package, so `uvicorn app.main:app` works from `apps/api`.
- `docker compose up` runs both apps for local dev with bind mounts and hot reload. Inside compose, server-side fetches use `API_URL_INTERNAL=http://api:8000`, and the browser uses `NEXT_PUBLIC_API_URL`.
- Supabase dev project `mock-interview-dev` (ref `psgayxaehcsjhlnuzebi`, region ap-south-1). The web app uses the new publishable key (`sb_publishable_...`) instead of the legacy anon JWT. `.mcp.json` is scoped to this project.
- Gemini is the default for all three providers (`LLM_PROVIDER=gemini`); models are pinned by env (`GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`). Embeddings are `gemini-embedding-001` at 768 dims, matching `vector(768)`.
- `generate_json` retry-once logic lives in `LLMProvider` (base class), so every provider gets the same validation and `InvalidLLMOutputError` behavior.
- FastAPI connects to Postgres directly (`DATABASE_URL`, transaction pooler) and bypasses RLS. Services must always filter by `user_id`. RLS protects any direct client access.
- Question bank lives in `apps/api/scripts/data/questions.json` (100 hand-written questions); the seed script embeds `topic + question + ideal_points` and upserts on `question`.
- Request-id middleware sets an `x-request-id` header and a log context var, which covers the structured-logging rule from the start.

## Known issues
- Supabase MCP is connected. context7, playwright and `.claude/` (`/feature`) from the kit are still missing.
- The Gemini key's Google Cloud project has **0 quota for generate_content** on every model (429, `quota_limit_value: 0`). Embeddings work. This must be fixed before F3 (JD questions) and F7 (evaluation): create the key in Google AI Studio on a project with free tier, or enable billing.
- STT and TTS providers are interfaces only; implementations come in F5 and F4.
- Not deployed yet (Vercel for `apps/web`, Railway for `apps/api`).

## Log
### 2026-10-05: Day 2 database + providers
- Migration `supabase/migrations/20261005090000_init_schema.sql` applied via MCP: `question_bank` (pgvector 768 + HNSW cosine index), `interviews`, `interview_turns`, all with RLS. Security advisor: no issues. RLS checked: anon sees nothing, authenticated can read the bank but no other users' interviews.
- `app/providers/base.py` (LLM, STT, TTS interfaces + typed errors), `providers/gemini.py`, `providers/factory.py` (env-based selection), `app/db.py` (async engine, pooler-safe).
- `scripts/seed_questions.py` + 100 questions (25 per role, junior/mid/senior). `--dry-run` validates the file.
- `apps/web/lib/database.types.ts` generated via MCP.
- Seeded: 100 rows (25 per role), all with 768-dim embeddings; a vector similarity check returns related questions (RAG → RAG questions, 0.87–0.90).
- `DATABASE_URL` must use the pooler host (`aws-0-ap-south-1.pooler.supabase.com:6543`, user `postgres.<ref>`). The direct `db.<ref>` host is IPv6-only and unreachable here.
- Gemini embed calls retry on 429 (free tier: 100 inputs/min) with batches of 50.
- Tests: 6 pass (health, generate_json retry/typed error, seed data shape). Live check: Gemini embeddings return 768 dims.
### 2026-10-05: Day 1 scaffold
- `apps/web`: Next.js 16 + TypeScript strict + Tailwind 4 + shadcn/ui, a `typecheck` script, and `lib/api.ts` (single fetch wrapper with Bearer-token support). The home page shows API health.
- `apps/api`: FastAPI with `/health`, CORS for localhost:3000, settings via pydantic-settings, request-id logging, ruff and pytest (1 test).
- `.env.example` for both apps, a root `.gitignore` and a README stub.
- Added `docker-compose.yml` plus a `Dockerfile.dev` for each app (dev only; production images come at deploy time).
- Verified: lint, typecheck, ruff and pytest pass. The web page shows the API as reachable.
