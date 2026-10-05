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
- Request-id middleware sets an `x-request-id` header and a log context var, which covers the structured-logging rule from the start.

## Known issues
- The project MCP config (`.mcp.json`) and `.claude/` from the kit are not in the repo yet, so context7, supabase, playwright and the `/feature` command are unavailable.
- Not deployed yet (Vercel for `apps/web`, Railway for `apps/api`).

## Log
### 2026-10-05: Day 1 scaffold
- `apps/web`: Next.js 16 + TypeScript strict + Tailwind 4 + shadcn/ui, a `typecheck` script, and `lib/api.ts` (single fetch wrapper with Bearer-token support). The home page shows API health.
- `apps/api`: FastAPI with `/health`, CORS for localhost:3000, settings via pydantic-settings, request-id logging, ruff and pytest (1 test).
- `.env.example` for both apps, a root `.gitignore` and a README stub.
- Added `docker-compose.yml` plus a `Dockerfile.dev` for each app (dev only; production images come at deploy time).
- Verified: lint, typecheck, ruff and pytest pass. The web page shows the API as reachable.
