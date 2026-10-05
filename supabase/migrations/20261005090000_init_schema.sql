-- Initial schema: question bank (pgvector), interviews, interview turns.
-- RLS: users only see their own interviews/turns; question_bank is read-only for authenticated users.

create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- question_bank
-- ---------------------------------------------------------------------------
create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('frontend', 'full_stack', 'ai_engineer', 'behavioral')),
  level text not null check (level in ('junior', 'mid', 'senior')),
  type text not null check (type in ('technical', 'behavioral')),
  topic text not null,
  question text not null unique,
  ideal_points text[] not null check (cardinality(ideal_points) between 3 and 5),
  embedding extensions.vector(768),
  audio_url text,
  created_at timestamptz not null default now()
);

create index question_bank_role_level_idx on public.question_bank (role, level);
create index question_bank_embedding_idx
  on public.question_bank using hnsw (embedding extensions.vector_cosine_ops);

alter table public.question_bank enable row level security;

create policy "question_bank is readable by authenticated users"
  on public.question_bank for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- interviews
-- ---------------------------------------------------------------------------
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('frontend', 'full_stack', 'ai_engineer', 'behavioral')),
  level text not null check (level in ('junior', 'mid', 'senior')),
  type text not null check (type in ('technical', 'behavioral', 'mixed')),
  num_questions smallint not null check (num_questions in (3, 5, 8)),
  job_description text check (char_length(job_description) <= 5000),
  status text not null default 'setup'
    check (status in ('setup', 'in_progress', 'completed', 'abandoned')),
  overall_score numeric(4, 2) check (overall_score between 0 and 10),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index interviews_user_created_idx on public.interviews (user_id, created_at desc);

alter table public.interviews enable row level security;

create policy "users read own interviews"
  on public.interviews for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users create own interviews"
  on public.interviews for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users update own interviews"
  on public.interviews for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users delete own interviews"
  on public.interviews for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- interview_turns
-- ---------------------------------------------------------------------------
create table public.interview_turns (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position smallint not null check (position >= 1),
  question text not null,
  ideal_points text[] not null,
  source text not null check (source in ('bank', 'jd')),
  question_bank_id uuid references public.question_bank (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'answered', 'skipped', 'evaluated')),
  transcript text,
  audio_path text,
  duration_seconds numeric(6, 2),
  metrics jsonb,
  scores jsonb,
  feedback jsonb,
  created_at timestamptz not null default now(),
  unique (interview_id, position)
);

create index interview_turns_user_idx on public.interview_turns (user_id);
create index interview_turns_question_bank_idx on public.interview_turns (question_bank_id);

alter table public.interview_turns enable row level security;

create policy "users read own turns"
  on public.interview_turns for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users create turns in own interviews"
  on public.interview_turns for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.interviews i
      where i.id = interview_id and i.user_id = (select auth.uid())
    )
  );

create policy "users update own turns"
  on public.interview_turns for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users delete own turns"
  on public.interview_turns for delete
  to authenticated
  using ((select auth.uid()) = user_id);
