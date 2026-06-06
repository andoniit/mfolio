-- One-time seed of voluntary / community roles.
-- Safe to run any time. Adds the newer columns if missing, then (re)inserts these rows.

alter table public.experiences add column if not exists logo_url text;
alter table public.experiences add column if not exists sort_order integer not null default 0;
alter table public.experiences add column if not exists category text not null default 'work';

delete from public.experiences
where category = 'volunteer'
  and company in (
    'Carboncopies Foundation',
    'Indian Student Association – Illinois Tech',
    'IEEE KLS GIT'
  );

insert into public.experiences
  (title, company, company_url, location, start_date, end_date, is_current,
   description, sort_order, category, published, published_at)
values
  (
    'JavaScript Developer',
    'Carboncopies Foundation',
    'https://roadmap.carboncopies.org',
    null,
    null,
    null,
    true,
    'The Carboncopies Foundation is a nonprofit dedicated to advancing the science and development of Whole Brain Emulation. As a JavaScript Developer, I engineer their interactive web application (roadmap.carboncopies.org) to visually track the complex research milestones required for this mission. This platform successfully translates highly technical data into an accessible, engaging roadmap for both the scientific community and the public.',
    1,
    'volunteer',
    true,
    now()
  ),
  (
    'Design Head',
    'Indian Student Association – Illinois Tech',
    null,
    null,
    '2023-08-01',
    '2025-01-01',
    false,
    'I served as Design Head for 3 semesters at ISA@IIT Chicago. I was also offered a 4th tenure as Design Head, but as I was in the final semester of my master''s, I had to decline the offer. In this role, I contributed significantly to art and culture by making and filming videos, managing the design team, and collaborating closely with the photography team.',
    2,
    'volunteer',
    true,
    now()
  ),
  (
    'Joint Secretary',
    'IEEE KLS GIT',
    null,
    null,
    '2021-12-01',
    '2022-10-01',
    false,
    'As Joint Secretary at IEEE KLS GIT, I coordinated internal communications, managed event logistics, and maintained documentation to ensure smooth operation of the team. I played a key role in organizing events and streamlining processes.',
    3,
    'volunteer',
    true,
    now()
  ),
  (
    'Webmaster',
    'IEEE KLS GIT',
    null,
    null,
    '2020-01-01',
    '2021-11-01',
    false,
    'As Webmaster at IEEE KLS GIT, I led website maintenance and development initiatives, ensuring the site was both visually appealing and functionally robust. I collaborated with multiple teams to manage content updates and optimize the user experience.',
    4,
    'volunteer',
    true,
    now()
  );
