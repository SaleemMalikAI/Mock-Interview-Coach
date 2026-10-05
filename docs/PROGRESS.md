# Progress Log

Claude updates this at the end of every feature. Newest entry on top.

| Feature | Status | Notes |
|---|---|---|
| F1 Auth | ✅ | Magic link + Google (Google needs OAuth client in dashboard), proxy guards, FastAPI JWKS verification |
| F2 Interview setup | ✅ | `/interview/new` → `POST /interviews` → redirect to `/interview/[id]` (room placeholder) |
| F3 Question plan (RAG) | ✅ | Built inside `POST /interviews`; ~2.5–2.9 s planning, 4.1–4.7 s per request from Pakistan to the Mumbai DB |
| F4 Interview room | 🟨 | Room UI, progress, question list, keyboard and re-record done; TTS playback and skip still to do |
| F5 Transcription | ✅ | Recorder (webm/mp4, 3-min cap, live level meter, Space key, review/re-record) → upload → transcript in 1.9–2.9 s |
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
- Interviews are created through FastAPI (`POST /interviews`), not directly from the browser via Supabase, so F3 can build the question plan in the same request later. The web side uses a Server Action that forwards the session token; the form keeps working without client-side fetch code.
- `role=behavioral` only allows `type=behavioral`: enforced in the Pydantic schema (422) and in the UI (other types disabled).
- Other users' interviews return 404, not 403, so ids can't be probed.
- Base UI radios put the `id` on a hidden native input; use `label[for=...]` or `aria-checked` on the visible span when testing.
- F3 plan is built in `POST /interviews` before the write transaction, then the interview and its turns are inserted in one commit. No interview ever exists without questions.
- Bank selection: requested level first (nearest level only when it runs out), distinct topics within a level, JD cosine similarity (pgvector `<=>`) as the order when a JD is given, otherwise random. Mixed = `num_questions // 3` behavioral questions. JD questions: 1 for 3-question interviews, else 2.
- JD safety: the JD is stripped of `<job_description>` tags and wrapped in them; the system prompt marks it untrusted and tells the model to ignore instructions inside it. Live test with an injection attempt produced a normal on-topic question.
- Every provider failure degrades instead of failing: embedding error → random order; LLM error, invalid JSON or > `JD_GENERATION_TIMEOUT_SECONDS` (3.5 s) → bank questions fill the JD slots.
- `ideal_points` are stored on turns but never returned by the API (grading key).
- Groq `reasoning_effort=low` (`GROQ_REASONING_EFFORT`): JD generation ~3.0 s → ~1.4 s with equal quality.
- DB round trips are ~160 ms from local dev to the Mumbai pooler, so the code minimizes them: `eager_defaults` + client-side UUIDs (no refresh queries), one bank query for both pools, and a startup warm-up (DB connection + JWKS). Deploy the API in or near `ap-south-1`.
- F5 audio goes to the private `answer-audio` bucket at `<user_id>/<interview_id>/<turn_id>.<ext>`. The API calls Storage with the **user's own JWT** + publishable key, so storage RLS (own folder only) does the scoping; no service-role key in the API. Rejected answers are deleted again.
- Whisper (`whisper-large-v3-turbo` on Groq) is prompted with filler words so it keeps "um/uh/like" for F6. It hallucinates "Thank you." on silence and `no_speech_prob` doesn't flag it, so transcripts made only of known filler phrases are treated as `empty_audio` (the recorder will also check mic level client-side).
- Answer errors return `{"detail": {"code", "message"}}` with codes `not_found` 404, `already_evaluated` 409, `unsupported_type` 415, `too_large` 413, `empty_audio`/`too_long` 422, `transcription_failed`/`upload_failed` 502.
- Storage objects can't be deleted with SQL (`storage.protect_delete`); use the Storage API.
- UI design system (2026-10-05 redesign): indigo brand, emerald success, amber warning, rose recording as oklch tokens with light/dark pairs in `globals.css`; Geist Sans/Mono; 44px+ touch targets (button `default` h-10, `lg` h-11, `xl` h-14); one shadow scale (`--shadow-soft`, `--shadow-lift`); Lucide icons only; dark mode via next-themes.
- Pages behind auth live in the `app/(app)` route group, whose layout renders the sticky header (logo, nav with active state, theme toggle, user menu). URLs are unchanged.
- Product name in the UI is "Mock Interview Coach". "InterviewCoach" was avoided because it is another company's brand (InterviewCoach.AI).
- Request-id middleware sets an `x-request-id` header and a log context var, which covers the structured-logging rule from the start.

## Known issues
- Supabase MCP is connected. context7, playwright and `.claude/` (`/feature`) from the kit are still missing.
- The Gemini key has 0 quota for text generation (embeddings work). Not a blocker since the LLM moved to Groq; `GeminiLLM` stays available via `LLM_PROVIDER=gemini` if the quota is fixed.
- The Groq key was pasted in chat once; rotate it in the Groq console when convenient.
- STT and TTS providers are interfaces only; implementations come in F5 and F4.
- Supabase Auth URL config must allow `http://localhost:3000/**` as a redirect URL, or magic links fall back to the Site URL and skip `/auth/callback` (dashboard setting, not available via MCP).
- Google sign-in needs a Google OAuth client ID/secret set in Supabase → Authentication → Providers → Google.
- The default Supabase email sender is heavily rate-limited (a few emails per hour). Add custom SMTP (e.g. Resend) before demos.
- No playwright MCP; UI checks use `@playwright/test` with system Chrome (`channel: "chrome"`) from ad-hoc scripts until the Day 9 e2e suite exists.
- First request after an API restart is still slower (~7–8 s) because the Groq/Gemini HTTPS connections are cold. Warming them would spend API quota, so it's left as is.
- Groq latency occasionally spikes (one 8.4 s response seen); the JD timeout keeps the plan under budget but that interview then has bank-only questions.
- Groq TTS (`canopylabs/orpheus-v1-english`) needs its terms accepted once in the Groq console before F4 can use it.
- Security advisor: "leaked password protection disabled" — not relevant while sign-in is magic link + Google only.
- `globals.css` from `shadcn init` had `--font-sans: var(--font-sans)` (self-reference), so the app rendered in the browser's serif font until the redesign fixed it.
- Not deployed yet (Vercel for `apps/web`, Railway for `apps/api`).

## Log
### 2026-10-05: UI redesign + F5 recorder
- Redesigned landing (hero with product preview, how it works, features, CTA), login (brand panel + form, Google "G" mark), dashboard (stats, real interview list via new `GET /interviews`, empty/loading/error states), setup (role cards with icons, segmented options, JD counter, sticky summary), room (progress, question card, recorder, transcript card, question stepper), 404 and room error page.
- `hooks/use-recorder.ts` (MediaRecorder, AnalyserNode meter, silence detection, 3-min cap, permission/no-mic/unsupported errors), `AnswerRecorder`, `TranscriptCard`, `QuestionSteps`, `InterviewRoom`. Turns now return the user's own transcript.
- Verified in Chrome with a fake microphone fed from a spoken WAV: record (Space), review, submit, transcript at 360px and 1280px, light and dark, zero horizontal overflow on every page, no console errors. 72 API tests pass.
### 2026-10-05: F5 Transcription (API)
- Migration `20261005120000_answer_audio_storage.sql` (bucket + 4 own-folder policies), `GroqSTT`, `services/storage.py`, `services/answers.py`, `routers/answers.py`. Upload and STT run in parallel.
- Live: 25 s answer transcribed in ~1.7 s (webm and mp4), re-record 2.4 s, and silence/wrong type/11 MB/foreign turn/no token each return their specific error. Turn → `answered`, interview → `in_progress`. 71 tests pass.
### 2026-10-05: F3 Question plan (RAG)
- `services/question_bank.py` (SQL repository, pgvector similarity), `services/question_plan.py` (allocation, level-first topic-diverse picking, JD generation, dedupe and backfill, ordering), prompts in `app/prompts/jd_questions_{system,user}.md`, `InterviewTurn` model, turns in `InterviewOut` (without `ideal_points`).
- Room page lists the planned questions (temporary until F4) and marks JD questions; setup button says "Preparing your questions…" while waiting.
- Tests: 49 pass (allocation table, counts for 3/5/8, level-first, level fallback, topic diversity, JD ordering, sanitizing and untrusted wrapper, duplicate replacement, LLM failure, LLM timeout, embedding failure, mixed). Live: 15 interviews / 111 turns with 0 duplicates and 0 position gaps; browser flow at 360px with no console errors.
### 2026-10-05: F2 Interview setup
- API: `models.py` (`Interview`), `schemas/interviews.py`, `services/interviews.py` (always scoped by `user_id`), `routers/interviews.py` (`POST /interviews`, `GET /interviews/{id}`), `db.get_session`. 13 new tests (26 total): create, own vs other user's interview, 7 invalid payloads, auth required, validators.
- Web: `/interview/new` with `OptionGroup` radio cards, job description counter (5,000 cap), Server Action with pending and error states; `/interview/[id]` placeholder room (404 for unknown or foreign ids); "New interview" on the dashboard.
- Verified in Chrome at 360px with a temporary user (deleted afterwards): no horizontal overflow, behavioral role locks the type, submit redirects to the room, the DB row matches the input, unknown id → 404.
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
