# Mock Interview Coach — Product Spec (PRD)

## Goal
A voice-first AI interviewer. The user picks a role, the app asks questions out loud, the user answers by voice, and the app scores each answer and gives feedback plus speech metrics.

Portfolio goal: deployed live, clean repo, and a demo you can show in under 2 minutes.

## Target user
Developers preparing for job interviews (frontend, full stack, AI engineer, plus behavioral rounds).

---

## MVP features

Each feature has an ID. Use these IDs in prompts, commits and PROGRESS.md.

### F1 — Auth
- Sign in with Google and with an email magic link (Supabase Auth).
- Protected routes: `/interview/*` and `/dashboard`.
- **Done when:** a logged-out user is redirected to `/login`, and a logged-in user sees their own data only (RLS on every table).

### F2 — Interview setup
- Fields: role (Frontend / Full Stack / AI Engineer / Behavioral), level (Junior / Mid / Senior), type (Technical / Behavioral / Mixed), number of questions (3 / 5 / 8), and an optional job description (max 5,000 characters).
- **Done when:** submitting creates an `interviews` row and redirects to the interview room.

### F3 — Question plan (RAG)
- Pull matching questions from `question_bank` by role, level and topic, using pgvector similarity against the JD when one is given.
- Add 1–2 questions generated from the JD (if provided).
- Save the plan as `interview_turns` rows with `question` and `ideal_points`.
- **Done when:** the plan is created in under 5 seconds, with no duplicate questions, and the JD is treated as untrusted text.

### F4 — Interview room
- Question card with TTS playback: auto-play, plus a replay button.
- Record button with a visible timer (3-minute max) and a live mic level meter.
- Re-record before submitting; skip question.
- Progress indicator ("Question 2 of 5").
- Keyboard: Space starts/stops recording.
- **Done when:** a full interview can be completed on desktop Chrome and mobile Safari.

### F5 — Transcription
- Upload the audio (webm/mp4, max 10 MB) to FastAPI, run STT, save the transcript and the audio URL (Supabase Storage).
- **Done when:** the transcript shows within about 3 seconds for a 60-second answer, with clear error states (no mic permission, upload failed, empty audio).

### F6 — Speech metrics (no LLM)
- Words per minute, filler-word count (um, uh, like, basically, actually, you know, so), answer duration, and word count.
- Pure Python in `services/metrics.py`, with unit tests.
- **Done when:** metrics show next to the transcript, with simple hints (for example "Aim for 120–160 WPM").

### F7 — Answer evaluation (streamed)
- The LLM scores the answer against `ideal_points` with a rubric, each 1–10: **accuracy, completeness, clarity, structure** (STAR method for behavioral), **conciseness**.
- Output: scores (validated JSON via Pydantic), 2 strengths, 2 improvements, and a short "stronger answer" example.
- Scores come back as JSON, then the written feedback streams over SSE.
- **Done when:** the first feedback text appears within 3 seconds of the transcript; invalid JSON triggers one retry and then a friendly error.

### F8 — Final report
- Overall score, a radar chart of the five dimensions, a per-question breakdown, the top 3 focus areas, the full transcript, and averaged speech metrics.
- **Done when:** the report loads at `/interview/[id]/report` and the interview status becomes `completed`.

### F9 — Dashboard
- A list of past interviews (role, date, score) and a line chart of the score trend over time.
- **Done when:** the empty state, loading state and list all render correctly.

### F10 — Limits, safety and polish
- Rate limit: 3 interviews per day per user (configurable).
- Audio size and duration limits enforced on the server.
- Prompt-injection guard: wrap the JD in delimiters and tell the model to ignore instructions inside it.
- Loading skeletons, error toasts, a 404 page; responsive down to 360px.
- **Done when:** abusive inputs fail gracefully and the Lighthouse accessibility score is 90 or higher.

---

## Extended features (added 2026-10-05, built after F4–F10)

### F11 — Progress & habits
- Sidebar navigation on desktop (collapsible to a top bar on mobile): Dashboard, Start interview, History, Question bank, Documents, STAR stories, Learning.
- Interview history page with filters (role, status, date) and search.
- Practice streak (consecutive days with at least one answered question) and weekly practice minutes (sum of answer durations).
- Skills breakdown: average of each rubric dimension across all scored answers, plus per-topic averages.
- Download the final report (F8) as a PDF.
- **Done when:** streak and weekly minutes match the data after answering on two different days, and the PDF report downloads with all report sections.

### F12 — Resume & cover letter
- Upload a resume and an optional cover letter (PDF or DOCX, max 5 MB) into a private bucket; extract the text on the server.
- Score each document against a job description with a rubric (impact, relevance to the JD, clarity, keywords/ATS readiness, formatting), with strengths and concrete fixes. Treat document text like the JD: untrusted, wrapped in tags.
- Interview setup can use the resume to add 1–2 questions about the candidate's own projects.
- **Done when:** a resume uploads, shows a score with feedback in under 15 seconds, and a new interview can include resume-based questions.

### F13 — STAR stories & learning journey
- STAR story bank: create, edit and tag stories (Situation, Task, Action, Result); the LLM reviews a story for completeness and gives fixes.
- Behavioral feedback (F7) points to a matching saved story when one exists.
- Learning journey: recommended topics and questions from the weakest rubric dimensions and topics, with progress as they improve.
- **Done when:** a user can save a story and get a review, and the learning page recommends at least 3 items based on real scores.

### F14 — Question bank browser
- Browse and search all `question_bank` questions by role, level, type and topic.
- Practice any single question on demand (creates a 1-question interview using the normal room, scoring and report).
- **Done when:** search returns matches in under 300 ms and "Practice this question" opens the room with that question.

---

## v2 (after you're hired, or if time allows)
- Adaptive follow-up questions based on the previous answer
- Resume upload, so questions are tailored to your projects
- Company-specific mode (paste a company name or careers page)
- Live-coding questions with a code editor
- Pause detection using STT word timestamps
- Shareable report link and PDF export
- Payments (Paddle or Lemon Squeezy)

---

## Non-functional requirements
- Bank-question audio is pre-generated and cached, so playback starts in under 1 second.
- STT, TTS and LLM sit behind provider interfaces (`providers/base.py`), so vendors can be swapped through env vars.
- No secrets in the repo; everything comes through `.env` files.
- Basic structured logging on the API (request id, latency, provider used).
- Tests: pytest for services, plus one Playwright happy-path test for the web app.
- 10 eval cases (sample answers with expected score ranges) to keep the grader consistent.

---

## 2-minute demo script (for interviews)
1. Log in, choose Full Stack / Mid / Technical / 3 questions, paste a real JD.
2. Answer one question well and one badly.
3. Show the streamed feedback, the score difference and the filler-word count.
4. Open the final report and the dashboard trend.
5. Show the architecture diagram in the README and explain the provider interface and the evals.
