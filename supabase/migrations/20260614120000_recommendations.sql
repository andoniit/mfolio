-- Visitor recommendations shown as sticky notes on the home page.
-- Submissions come in as 'pending' and only appear publicly once approved.
-- Run in Supabase SQL editor if migrations are not auto-applied.

create extension if not exists pgcrypto;

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  message text not null,
  color text not null default 'yellow',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists recommendations_status_idx
  on public.recommendations (status);

create index if not exists recommendations_created_at_idx
  on public.recommendations (created_at desc);

create index if not exists recommendations_sort_idx
  on public.recommendations (sort_order asc, created_at desc);

comment on table public.recommendations is
  'Visitor-submitted recommendations rendered as sticky notes on the home page after admin approval.';
