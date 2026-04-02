-- Ordered list of technology labels per project (e.g. "Next.js", "Supabase").
alter table public.projects
  add column if not exists tech_stack text[] not null default '{}';

comment on column public.projects.tech_stack is 'Ordered tech/tool names for the project detail page.';
