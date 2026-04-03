-- Newsletter subscribers (footer signup + future sources)

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  status text not null default 'active'
    check (status in ('active', 'unsubscribed')),
  source text not null default 'footer',
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

-- One subscription per email (case-insensitive)
create unique index if not exists newsletter_subscribers_email_lower_idx
  on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status);

create index if not exists newsletter_subscribers_subscribed_at_idx
  on public.newsletter_subscribers (subscribed_at desc);

comment on table public.newsletter_subscribers is 'Email list for newsletter; unsubscribe via unsubscribe_token.';
