-- Projects CMS (matches app expectations). Run in Supabase SQL editor if migrations are not auto-applied.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  content_json jsonb,
  content_html text,
  cover_image_url text,
  tech_stack text[] not null default '{}',
  project_date date,
  published boolean not null default false,
  published_at timestamptz,
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_published_trashed_idx
  on public.projects (published, trashed_at);

create index if not exists projects_slug_idx
  on public.projects (slug);

create index if not exists projects_project_date_idx
  on public.projects (project_date desc nulls last);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_images_project_id_sort_idx
  on public.project_images (project_id, sort_order);
