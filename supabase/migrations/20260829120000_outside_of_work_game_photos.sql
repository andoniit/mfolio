-- The "Outside of work" section became three blocks: the photos I shoot, the
-- captures off the PS5, and the list of games. That needs a third `kind`, plus
-- a "half done" state for games that were started and parked.
--
-- Both columns are guarded by inline CHECK constraints whose names Postgres
-- generated, so each is dropped by lookup rather than by a guessed name.
-- Run in Supabase SQL editor if migrations are not auto-applied.

do $$
declare
  c record;
begin
  -- Widen `kind` to allow 'game_photo'. 'food' stays permitted: the tile was
  -- removed from the app, but an old row must not become unreadable.
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'outside_of_work_items'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%kind%'
  loop
    execute format('alter table public.outside_of_work_items drop constraint %I', c.conname);
  end loop;

  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'outside_of_work_items'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%game_status%'
  loop
    execute format('alter table public.outside_of_work_items drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.outside_of_work_items
  add constraint outside_of_work_items_kind_check
  check (kind in ('photo', 'game_photo', 'game', 'food'));

alter table public.outside_of_work_items
  add constraint outside_of_work_items_game_status_check
  check (
    game_status is null
    or game_status in ('playing', 'completed', 'half_done', 'backlog', 'wishlist')
  );

comment on column public.outside_of_work_items.kind is
  'photo = pictures I took, game_photo = PS5 captures, game = a played title. food is legacy.';
