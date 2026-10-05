# Progress Log

Claude updates this at the end of every feature. Newest entry on top.

| Feature | Status | Notes |
|---|---|---|
| F1 Auth | ✅ | Magic link + Google (Google needs OAuth client in dashboard), proxy guards, FastAPI JWKS verification |
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
- Providers: **Groq** for the LLM (`openai/gpt-oss-120b`, strict JSON schema, ~1.5s per JSON call, first stream chunk ~0.5–1.2s) and later STT (`whisper-large-v3-turbo`) and TTS (`canopylabs/orpheus-v1-english`). **Gemini** only for embeddings (`gemini-embedding-001`, 768 dims, matching `vector(768)`).
- Embeddings are their own `EmbeddingProvider` (`EMBEDDING_PROVIDER`), separate from `LLMProvider`, so the LLM vendor can change without re-seeding. Changing the embedding model requires re-running the seed.
- `generate_json` retry-once logic lives in `LLMProvider` (base class), so every provider gets the same validation and `InvalidLLMOutputError` behavior.
- FastAPI connects to Postgres directly (`DATABASE_URL`, transaction pooler) and bypasses RLS. Services must always filter by `user_id`. RLS protects any direct client access.
- Question bank lives in `apps/api/scripts/data/questions.json` (100 hand-written questions); the seed script embeds `topic + question + ideal_points` and upserts on `question`.
- Auth tokens are verified in FastAPI against the project JWKS (`/auth/v1/.well-known/jwks.json`, ES256) with PyJWT, checking `aud=authenticated` and `iss`. No JWT secret needed; `SUPABASE_JWT_SECRET` dropped.
- Next 16 uses `proxy.ts` (formerly middleware). It refreshes the Supabase session with `getClaims()` and redirects logged-out users from `/dashboard` and `/interview/*` to `/login?next=...`. Pages also check `getClaims()` themselves, so a matcher mistake can't expose data.
- `?next=` is restricted to same-site relative paths (`lib/safe-redirect.ts`) to prevent open redirects.
- Route handlers redirect with a relative `Location` header: inside Docker, `request.nextUrl` reports the bind host `0.0.0.0`.
- shadcn here is the Base UI flavor (`base-nova`): `Button` has no `asChild`. Use `buttonVariants()` on a `Link` instead.
- Request-id middleware sets an `x-request-id` header and a log context var, which covers the structured-logging rule from the start.

## Known issues
- Supabase MCP is connected. context7, playwright and `.claude/` (`/feature`) from the kit are still missing.
- The Gemini key has 0 quota for text generation (embeddings work). Not a blocker since the LLM moved to Groq; `GeminiLLM` stays available via `LLM_PROVIDER=gemini` if the quota is fixed.
- The Groq key was pasted in chat once; rotate it in the Groq console when convenient.
- STT and TTS providers are interfaces only; implementations come in F5 and F4.
- Supabase Auth URL config must allow `http://localhost:3000/**` as a redirect URL, or magic links fall back to the Site URL and skip `/auth/callback` (dashboard setting, not available via MCP).
- Google sign-in needs a Google OAuth client ID/secret set in Supabase → Authentication → Providers → Google.
- The default Supabase email sender is heavily rate-limited (a few emails per hour). Add custom SMTP (e.g. Resend) before demos.
- Not checked with the playwright MCP (not installed); verified with curl and a real session instead.
- Not deployed yet (Vercel for `apps/web`, Railway for `apps/api`).

## Log
### 2026-10-05: F1 Auth
- Web: `@supabase/ssr` clients (`lib/supabase/{client,server,proxy}.ts`), `proxy.ts`, `/login` (Google + magic link, loading and error states, toasts), `/auth/callback` (PKCE code exchange), `/auth/signout` (POST), `/dashboard` placeholder that calls FastAPI `/me` with the session token.
- API: `app/auth.py` (`get_current_user` / `CurrentUserDep`), `GET /me`. 7 new tests: valid, missing, expired, wrong audience, wrong issuer, wrong key, malformed.
- Verified end to end with a temporary dev user (deleted afterwards): `/me` returns the user, the dashboard renders with "verified", `/login` redirects signed-in users, and logged-out users are redirected from `/dashboard` and `/interview/*`. RLS via REST: own insert 201, insert for another user 42501, anon sees nothing, authenticated sees all 100 bank questions.
### 2026-10-05: Day 2 database + providers
- Migration `supabase/migrations/20261005090000_init_schema.sql` applied via MCP: `question_bank` (pgvector 768 + HNSW cosine index), `interviews`, `interview_turns`, all with RLS. Security advisor: no issues. RLS checked: anon sees nothing, authenticated can read the bank but no other users' interviews.
- `app/providers/base.py` (LLM, STT, TTS interfaces + typed errors), `providers/gemini.py`, `providers/factory.py` (env-based selection), `app/db.py` (async engine, pooler-safe).
- `scripts/seed_questions.py` + 100 questions (25 per role, junior/mid/senior). `--dry-run` validates the file.
- `apps/web/lib/database.types.ts` generated via MCP.
- Seeded: 100 rows (25 per role), all with 768-dim embeddings; a vector similarity check returns related questions (RAG → RAG questions, 0.87–0.90).
- `DATABASE_URL` must use the pooler host (`aws-0-ap-south-1.pooler.supabase.com:6543`, user `postgres.<ref>`). The direct `db.<ref>` host is IPv6-only and unreachable here.
- Switched LLM to Groq (`providers/groq.py`) and split out `EmbeddingProvider`; verified live: generate_json, stream_text, generate_text (Groq) and embed (Gemini).
- Gemini embed calls retry on 429 (free tier: 100 inputs/min) with batches of 50.
- Tests: 6 pass (health, generate_json retry/typed error, seed data shape). Live check: Gemini embeddings return 768 dims.
### 2026-10-05: Day 1 scaffold
- `apps/web`: Next.js 16 + TypeScript strict + Tailwind 4 + shadcn/ui, a `typecheck` script, and `lib/api.ts` (single fetch wrapper with Bearer-token support). The home page shows API health.
- `apps/api`: FastAPI with `/health`, CORS for localhost:3000, settings via pydantic-settings, request-id logging, ruff and pytest (1 test).
- `.env.example` for both apps, a root `.gitignore` and a README stub.
- Added `docker-compose.yml` plus a `Dockerfile.dev` for each app (dev only; production images come at deploy time).
- Verified: lint, typecheck, ruff and pytest pass. The web page shows the API as reachable.
