-- Optional: if uploads fail with "new row violates row-level security policy",
-- add policies for the `blog-images` bucket so authenticated users can manage
-- `resume/current.pdf` while the file stays publicly readable.
--
-- Adjust bucket name if yours differs.

-- Allow public read (skip if your bucket is already public for all objects).
-- create policy "Public read blog-images"
-- on storage.objects for select
-- using (bucket_id = 'blog-images');

-- Allow signed-in users to upload/replace/delete resume path only.
-- create policy "Auth upload resume"
-- on storage.objects for insert
-- to authenticated
-- with check (bucket_id = 'blog-images' and (storage.foldername(name))[1] = 'resume');

-- create policy "Auth update resume"
-- on storage.objects for update
-- to authenticated
-- using (bucket_id = 'blog-images' and (storage.foldername(name))[1] = 'resume');

-- create policy "Auth delete resume"
-- on storage.objects for delete
-- to authenticated
-- using (bucket_id = 'blog-images' and (storage.foldername(name))[1] = 'resume');
