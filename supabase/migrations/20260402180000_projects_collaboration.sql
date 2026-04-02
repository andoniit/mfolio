-- Workplace, client, and collaborators for each project.
alter table public.projects
  add column if not exists collaborators text[] not null default '{}';

alter table public.projects
  add column if not exists workplace text;

alter table public.projects
  add column if not exists client_name text;

comment on column public.projects.collaborators is 'People you collaborated with (ordered).';
comment on column public.projects.workplace is 'Company, team, or org where the work happened.';
comment on column public.projects.client_name is 'Client name if this was client work.';
