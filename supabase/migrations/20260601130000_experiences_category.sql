-- Distinguish work experience from voluntary roles within the same table.
-- Run in Supabase SQL editor if migrations are not auto-applied.

alter table public.experiences
  add column if not exists category text not null default 'work';

create index if not exists experiences_category_idx
  on public.experiences (category, published, trashed_at);
