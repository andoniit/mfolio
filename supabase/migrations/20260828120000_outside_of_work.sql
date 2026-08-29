-- "Outside of work" bento section on the home page: the photos I shoot, the food
-- spots I keep going back to, and the games sitting on my PS5. One table with a
-- `kind` discriminator — the three tiles differ in presentation, not in shape.
-- Run in Supabase SQL editor if migrations are not auto-applied.

create extension if not exists pgcrypto;

create table if not exists public.outside_of_work_items (
  id uuid primary key default gen_random_uuid(),
  -- Which tile the row renders in.
  kind text not null check (kind in ('photo', 'food', 'game')),
  -- photo: caption · food: restaurant/dish · game: game title
  title text not null,
  -- photo: where it was shot · food: city or cuisine · game: platform (PS5, PC…)
  subtitle text,
  description text,
  -- Public URL of the image (photo, dish shot, or game cover art).
  image_url text,
  -- Object path inside the bucket, kept so deleting a row can drop the file too.
  storage_path text,
  -- food: Maps/Yelp link · game: store or trailer link
  link_url text,
  -- food only: 1–5 how much I liked it.
  rating smallint check (rating is null or (rating between 1 and 5)),
  -- game only: where it sits in the backlog.
  game_status text check (
    game_status is null
    or game_status in ('playing', 'completed', 'backlog', 'wishlist')
  ),
  tags text[] not null default '{}',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outside_of_work_items_kind_idx
  on public.outside_of_work_items (kind);

create index if not exists outside_of_work_items_published_idx
  on public.outside_of_work_items (is_published);

create index if not exists outside_of_work_items_sort_idx
  on public.outside_of_work_items (kind, sort_order asc, created_at desc);

comment on table public.outside_of_work_items is
  'Photos, food spots, and PS5 games rendered in the "Outside of work" section on the home page.';
