-- Experience / work history CMS. Run in Supabase SQL editor if migrations are not auto-applied.

create extension if not exists pgcrypto;

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  company_url text,
  logo_url text,
  location text,
  employment_type text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  highlights text[] not null default '{}',
  skills text[] not null default '{}',
  sort_order integer not null default 0,
  published boolean not null default false,
  published_at timestamptz,
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill columns if the table was created before these were added.
alter table public.experiences add column if not exists logo_url text;
alter table public.experiences add column if not exists sort_order integer not null default 0;

create index if not exists experiences_published_trashed_idx
  on public.experiences (published, trashed_at);

create index if not exists experiences_sort_idx
  on public.experiences (sort_order asc);

create index if not exists experiences_start_date_idx
  on public.experiences (start_date desc nulls last);
