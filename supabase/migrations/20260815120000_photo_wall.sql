-- Visitor Polaroids for the photo wall under the camera section on the home page.
-- A visitor snaps a Polaroid, writes a caption on it, and submits; the row lands
-- as 'pending' and only shows up publicly once approved from the admin dashboard.
-- Run in Supabase SQL editor if migrations are not auto-applied.

create extension if not exists pgcrypto;

create table if not exists public.photo_wall_posts (
  id uuid primary key default gen_random_uuid(),
  -- Public URL of the square photo (uploaded to the `blog-images` bucket
  -- server-side, under `photo-wall/`).
  image_url text not null,
  -- Object path inside the bucket, kept so deleting a post can also remove the file.
  storage_path text,
  message text not null,
  author_name text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists photo_wall_posts_status_idx
  on public.photo_wall_posts (status);

create index if not exists photo_wall_posts_created_at_idx
  on public.photo_wall_posts (created_at desc);

create index if not exists photo_wall_posts_sort_idx
  on public.photo_wall_posts (sort_order asc, created_at desc);

comment on table public.photo_wall_posts is
  'Visitor-submitted Polaroids rendered on the home page photo wall after admin approval.';
