-- F5: private bucket for recorded answers. Objects live under "<user_id>/<interview_id>/<turn_id>.<ext>".
-- The API uploads with the user's own JWT, so these policies are what scope access.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'answer-audio',
  'answer-audio',
  false,
  10485760,
  array['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload answer audio to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'answer-audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users read own answer audio"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'answer-audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Re-recording an answer overwrites the same path (upsert needs update as well as insert).
create policy "users replace own answer audio"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'answer-audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'answer-audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete own answer audio"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'answer-audio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
