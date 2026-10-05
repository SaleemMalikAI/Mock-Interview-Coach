-- F11/F13/F14 groundwork:
-- 1. answered_at on turns, for streaks and weekly practice minutes.
-- 2. 1-question interviews, for "practice this question" (F14).
-- 3. star_stories, the user's reusable behavioral stories (F13).

alter table public.interview_turns add column answered_at timestamptz;
update public.interview_turns set answered_at = created_at where status in ('answered', 'evaluated') and answered_at is null;
create index interview_turns_user_answered_idx on public.interview_turns (user_id, answered_at desc)
  where answered_at is not null;

alter table public.interviews drop constraint interviews_num_questions_check;
alter table public.interviews add constraint interviews_num_questions_check check (num_questions in (1, 3, 5, 8));

create table public.star_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  situation text not null default '' check (char_length(situation) <= 2000),
  task text not null default '' check (char_length(task) <= 2000),
  action text not null default '' check (char_length(action) <= 3000),
  result text not null default '' check (char_length(result) <= 2000),
  tags text[] not null default '{}' check (cardinality(tags) <= 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index star_stories_user_updated_idx on public.star_stories (user_id, updated_at desc);

alter table public.star_stories enable row level security;

create policy "users read own stories" on public.star_stories for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "users create own stories" on public.star_stories for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "users update own stories" on public.star_stories for update
  to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete own stories" on public.star_stories for delete
  to authenticated using ((select auth.uid()) = user_id);
