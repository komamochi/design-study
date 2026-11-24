-- DESIGN STUDY：教材に入れる PDF の置き場所
-- Supabase の「SQL Editor」に全部貼り付けて「Run」を押すと作られます。何度実行しても壊れません。
-- 置き場所は非公開。ログインした本人だけが、自分のフォルダのファイルを読み書きできます。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-files', 'study-files', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "study-files own read" on storage.objects;
create policy "study-files own read" on storage.objects for select to authenticated
  using (bucket_id = 'study-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "study-files own insert" on storage.objects;
create policy "study-files own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'study-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "study-files own delete" on storage.objects;
create policy "study-files own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'study-files' and (storage.foldername(name))[1] = auth.uid()::text);
