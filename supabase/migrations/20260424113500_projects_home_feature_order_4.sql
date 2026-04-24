-- Allow 4 featured project slots on home page.
-- Fixes: violates check constraint "projects_home_feature_order_check"

alter table public.projects
  add column if not exists home_feature_order integer;

alter table public.projects
  drop constraint if exists projects_home_feature_order_check;

alter table public.projects
  add constraint projects_home_feature_order_check
  check (
    home_feature_order is null
    or (home_feature_order >= 1 and home_feature_order <= 4)
  );

create index if not exists projects_home_feature_order_idx
  on public.projects (home_feature_order asc nulls last);

