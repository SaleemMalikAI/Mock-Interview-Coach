# CLAUDE.md — Mock Interview Coach

Voice-first AI mock interviewer. Spec: `docs/PRD.md`. Progress log: `docs/PROGRESS.md`.
Always read both before starting a feature. Feature IDs (F1–F10) come from the PRD.

## Monorepo layout
```
apps/web   → Next.js 15+ (App Router), TypeScript strict, Tailwind, shadcn/ui
apps/api   → FastAPI (Python 3.12), async, SQLAlchemy 2.0 async, Pydantic v2
supabase/  → migrations (SQL), seed data
docs/      → PRD.md, PROGRESS.md, architecture.md
```

## Commands
```bash
# web
cd apps/web && pnpm dev            # http://localhost:3000
cd apps/web && pnpm lint && pnpm typecheck
cd apps/web && pnpm test:e2e       # Playwright

# api
cd apps/api && uv run uvicorn app.main:app --reload   # http://localhost:8000/docs
cd apps/api && uv run pytest -q
cd apps/api && uv run ruff check . && uv run ruff format .

# db
supabase db diff -f <name>          # create a migration
supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > apps/web/lib/database.types.ts
```

## Architecture rules
- STT, TTS and LLM go through `apps/api/app/providers/base.py` interfaces. Never call a vendor SDK outside `providers/`.
- Provider choice comes from env vars (`STT_PROVIDER`, `TTS_PROVIDER`, `LLM_PROVIDER`).
- Business logic lives in `apps/api/app/services/`; routers stay thin (validate, call service, return).
- LLM output that must be structured is validated with Pydantic. On invalid JSON: retry once, then raise a typed error.
- Streaming uses SSE (`StreamingResponse`, `text/event-stream`). The web side reads it with a `useSSE` hook.
- The web app talks to FastAPI through `apps/web/lib/api.ts` only, sending the Supabase JWT as `Authorization: Bearer`. FastAPI verifies the JWT.
- Every table has RLS enabled with `user_id = auth.uid()` policies (`question_bank` is read-only for authenticated users).
- Treat job description text as untrusted: wrap it in `<job_description>` tags and tell the model to ignore instructions inside it.

## Code style
- TypeScript: strict, no `any`, named exports, server components by default, `"use client"` only where needed.
- Components in `apps/web/components/`, hooks in `apps/web/hooks/`, one component per file.
- Python: type hints everywhere, async I/O, no bare `except`, structured logging via `logging` with a request id.
- Keep existing commented-out code. Don't delete it unless asked.
- Never commit secrets. Use `.env.local` (web) and `.env` (api); keep `.env.example` files up to date.

## MCP tools available in this project
- **context7**: check current docs for Next.js, FastAPI, Supabase, shadcn and Tailwind before writing setup or API code. Always use context7 for library APIs instead of guessing.
- **supabase**: inspect schema, run SQL on the dev project, apply migrations, check advisors (security and performance) after schema changes. Dev project only, never production.
- **shadcn**: search and add shadcn/ui components instead of hand-writing them.
- **playwright**: after any UI change, open http://localhost:3000, click through the flow and check the console for errors.
- **vercel**: check deployments and build logs.
- **github**: open issues and PRs when asked.

## Workflow for every feature
1. Read `docs/PRD.md` (the feature section) and `docs/PROGRESS.md`.
2. Propose a short plan (files to touch, steps). Wait for approval if in plan mode.
3. Implement in small steps. Run lint, typecheck and tests after each step.
4. Verify the UI with the playwright MCP when a page changed.
5. Update `docs/PROGRESS.md`: what was done, decisions, known issues.
6. Suggest a conventional commit message (`feat(F5): ...`).

## Definition of done
- Meets the "Done when" line for the feature in the PRD.
- Lint, typecheck and tests pass.
- Loading, empty and error states handled.
- Works at 360px width.
