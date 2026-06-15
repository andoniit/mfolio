-- Seed the 3 existing LinkedIn recommendations as pre-approved sticky notes.
-- Safe to run after 20260614120000_recommendations.sql. Re-running is a no-op
-- (each insert is skipped if a recommendation with the same name already exists).

insert into public.recommendations (name, role, message, color, status, sort_order, approved_at)
select
  'Rohan Juvali',
  'Managing Director at Mynex Alloys Private Limited',
  E'I had the pleasure of working with Anirudha while he developed the website for our company Mynex Alloys Private Limited. From the very beginning, he demonstrated exceptional technical expertise, creativity, and professionalism.\n\nAnirudha not only understood our requirements thoroughly but also provided valuable insights to enhance the user experience and functionality of our website.',
  'purple',
  'approved',
  0,
  now()
where not exists (select 1 from public.recommendations where name = 'Rohan Juvali');

insert into public.recommendations (name, role, message, color, status, sort_order, approved_at)
select
  'Abhishek Deshmukh',
  'Assistant Professor at Gogte Institute of Technology, Senior Member IEEE',
  'Anirudha is a perfect example of an extraordinary student and a volunteer. He was my Student Executive Committee Team member for two years and was the Webmaster and Joint-Secretary. He really changed the way the student chapter website was being handled compared to the earlier years. This volunteering experience also gave him a chance to manage the State level IEEE Bangalore Section Young Professionals Group website for the whole year. He was also the winner of the State Level Website contest. Due to his support to the Student Branch website, we won the state award of the outstanding student branch website for that year.',
  'lime',
  'approved',
  1,
  now()
where not exists (select 1 from public.recommendations where name = 'Abhishek Deshmukh');

insert into public.recommendations (name, role, message, color, status, sort_order, approved_at)
select
  'Ar. Deepa Devangmath',
  'LEED Green Associate | AIAs | Architect | Researcher | NOMA',
  'I had a great experience working with Anirudha on my architectural website. I wanted clean graphics and dynamic animations for an interactive user experience, and he delivered brilliantly. The front-end development, often the toughest part, was executed flawlessly. His expertise in blending design with functionality made the website truly stand out. Highly recommend him for top-notch front-end development!',
  'red',
  'approved',
  2,
  now()
where not exists (select 1 from public.recommendations where name = 'Ar. Deepa Devangmath');
