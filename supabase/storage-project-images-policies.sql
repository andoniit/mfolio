-- Optional: if project image uploads fail with RLS errors, add policies for
-- the `project-images` bucket (create it in Dashboard → Storage, public read).
--
-- App uploads to: `covers/...` and `gallery/...`

-- create policy "Public read project-images"
-- on storage.objects for select
-- using (bucket_id = 'project-images');

-- create policy "Auth upload project images"
-- on storage.objects for insert
-- to authenticated
-- with check (
--   bucket_id = 'project-images'
--   and (storage.foldername(name))[1] in ('covers', 'gallery')
-- );

-- create policy "Auth update project images"
-- on storage.objects for update
-- to authenticated
-- using (
--   bucket_id = 'project-images'
--   and (storage.foldername(name))[1] in ('covers', 'gallery')
-- );

-- create policy "Auth delete project images"
-- on storage.objects for delete
-- to authenticated
-- using (
--   bucket_id = 'project-images'
--   and (storage.foldername(name))[1] in ('covers', 'gallery')
-- );
