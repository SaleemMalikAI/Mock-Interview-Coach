# 10-Day Build Playbook (Claude Code + MCPs)

Budget: about 2–3 hours a day, **after** your 5 job applications. Claude writes most of the code; your job is to plan, review, test, and understand every file well enough to explain it in an interview.

---

## Part 1 — One-time setup (about 45 min, Day 0)

### 1. Accounts (all have free tiers)
- **Supabase**: create a project named `mock-interview-dev`. Copy the project ref (Settings → General).
- **Groq** (STT) and **OpenAI** or **Gemini** (LLM + TTS): create API keys.
- **Vercel** and **Railway** (or Render): sign in with GitHub.
- **Context7** (optional): a free API key raises the rate limit.

### 2. Repo
```bash
mkdir mock-interview-coach && cd mock-interview-coach
git init
# copy everything from this kit into the repo root:
#   CLAUDE.md  .mcp.json  .claude/  docs/
```

### 3. Environment variable for the Supabase MCP
```bash
# add to ~/.bashrc or ~/.zshrc so .mcp.json can read it
export SUPABASE_PROJECT_REF=your-project-ref
```

### 4. GitHub MCP (local scope, so your token never lands in the repo)
```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer YOUR_GITHUB_PAT"
```
Use a fine-grained token scoped to this one repo.

### 5. Start Claude Code and connect everything
```bash
claude            # approve the project MCP servers from .mcp.json when asked
/mcp              # sign in to supabase and vercel (OAuth opens in the browser)
```
Check that `/mcp` shows context7, supabase, vercel, shadcn, playwright and github as connected.

> Using OpenCode instead? It reads `AGENTS.md`, so run `cp CLAUDE.md AGENTS.md` and add the same MCP servers to your OpenCode config.

---

## Part 2 — Rules that make it fast

1. **One feature per session.** Run `/clear` before every new feature. Small context means better code.
2. **Plan first.** Press Shift+Tab to enter plan mode, or use `/feature F5`. Read the plan, correct it, then let it build.
3. **Commit after every working step.** If Claude breaks something, `git checkout .` and retry with a clearer prompt.
4. **Let MCPs do the checking:**
   - "use context7" whenever touching library setup (Next.js, Supabase SSR, FastAPI).
   - The supabase MCP writes migrations and runs advisors after schema changes.
   - The playwright MCP clicks through the UI and reads console errors, so you're not screenshotting bugs by hand.
5. **Run `code-reviewer` before every commit** ("use the code-reviewer subagent").
6. **Understand before moving on.** End each day with: "Explain today's code to me like I'm in an interview, then ask me 3 questions about it." This doubles as interview prep and works on your communication feedback.
7. **Don't fight it for more than 15 minutes.** If Claude loops on a bug, `/clear`, paste the exact error, and say what you already tried.

---

## Part 3 — Day-by-day prompts (copy-paste)

### Day 1 — Scaffold + deploy hello world
```
Read CLAUDE.md and docs/PRD.md. Use context7 for current Next.js, shadcn and FastAPI setup docs.
Scaffold the monorepo:
- apps/web: Next.js App Router, TypeScript strict, Tailwind, shadcn/ui (init with the shadcn MCP), pnpm, eslint, a "typecheck" script.
- apps/api: FastAPI with uv, app/main.py with GET /health, CORS for localhost:3000, ruff, pytest with one health test.
- .env.example files for both, a root README stub, and a .gitignore.
Plan first, then build. Run both apps and confirm /health works.
```
Then deploy: web to Vercel (root `apps/web`) and api to Railway (root `apps/api`). Ask Claude for a `Dockerfile` or `railway.json` if needed, and use the vercel MCP to check the build logs.

### Day 2 — Database + question bank
```
Using the supabase MCP on the dev project, create a migration for the schema in docs/PRD.md
(question_bank with pgvector, interviews, interview_turns) with RLS policies as described in CLAUDE.md.
Run the security advisors after applying it.
Then write apps/api/scripts/seed_questions.py that seeds ~100 questions
(25 frontend, 25 full stack, 25 AI engineer, 25 behavioral; mixed levels) each with 3–5 ideal_points,
and generates embeddings through the LLM provider interface. Create providers/base.py first.
```

### Day 3 — F1 Auth + F2 Setup
```
/feature F1
```
```
/feature F2
```

### Day 4 — F3 Question plan + F5 Transcription
```
/feature F3
```
```
/feature F5   (build the useRecorder hook with MediaRecorder: webm on Chrome, mp4 on Safari, 3-minute cap, mic level meter)
```

### Day 5 — F4 Interview room + TTS
```
/feature F4
Also: add a script that pre-generates TTS audio for every question_bank row and stores it in Supabase Storage,
so bank questions play instantly. Use the frontend-design approach: clean, focused, dark-mode friendly.
```

### Day 6 — F7 Evaluation (the core feature)
```
/feature F7
Write the evaluation prompt in apps/api/app/prompts/evaluate.md. Scores come back as JSON validated by Pydantic,
then the written feedback streams over SSE. Add a useSSE hook on the web side.
```

### Day 7 — F6 Metrics + catch-up
```
/feature F6
Use the test-writer subagent to cover metrics.py fully (filler words, WPM, empty transcript, punctuation).
```
Use leftover time to fix anything rough from Days 3–6.

### Day 8 — F8 Report + F9 Dashboard
```
/feature F8
```
```
/feature F9
```

### Day 9 — F10 Polish, tests, evals
```
/feature F10
```
```
Use the test-writer subagent to add: pytest coverage for every service, and one Playwright happy-path test
for the full interview flow with a fake microphone. Then create apps/api/evals/ with 10 sample answers
(good, average, bad) and expected score ranges, plus a script that runs them and prints pass/fail.
```

### Day 10 — Ship it
```
Write a strong README.md: one-line pitch, live demo link, a GIF placeholder, features, an architecture
diagram in Mermaid, tech stack, the provider-interface design, how evals work, local setup, and env vars.
Also write docs/architecture.md with the request flow for one answer (record → STT → metrics → evaluate → stream).
```
Then:
- Record a 60–90s demo (follow the demo script at the end of PRD.md) and convert it to a GIF.
- Pin the repo on GitHub, add the live link to your portfolio and CV projects section.
- Post on LinkedIn with the demo video.

---

## Part 4 — Interview talking points you'll be able to give
- **"Walk me through the architecture."** Next.js → FastAPI → providers; Supabase for auth, DB, vectors and storage.
- **"How did you handle latency?"** Pre-generated TTS, streaming feedback over SSE, async FastAPI.
- **"How do you trust LLM output?"** Pydantic validation, one retry, eval set with expected score ranges.
- **"Security?"** RLS on every table, JWT verified in FastAPI, rate limits, JD treated as untrusted input.
- **"How did you use AI tools?"** CLAUDE.md conventions, MCPs for docs, DB and browser testing, a reviewer subagent, and you reviewed and understood every change.
