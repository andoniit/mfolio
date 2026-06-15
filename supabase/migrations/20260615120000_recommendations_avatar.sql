-- Optional avatar shown in the sticky-note circle. May be a hosted image URL
-- (admin upload / pasted link) or a compact data URL (public form upload).
-- Run in Supabase SQL editor if migrations are not auto-applied.

alter table public.recommendations add column if not exists avatar_url text;
