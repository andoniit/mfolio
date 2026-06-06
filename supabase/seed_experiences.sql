-- One-time seed of the existing portfolio experiences.
-- Safe to run any time. Adds the newer columns if missing, then (re)inserts these rows.

alter table public.experiences add column if not exists logo_url text;
alter table public.experiences add column if not exists sort_order integer not null default 0;
alter table public.experiences add column if not exists category text not null default 'work';

delete from public.experiences
where company in ('Artversion', 'Artarray', 'Freelance', 'IEEE Bangalore Young Professionals');

insert into public.experiences
  (title, company, logo_url, location, employment_type, start_date, end_date, is_current,
   highlights, skills, sort_order, published, published_at)
values
  (
    'Software Developer',
    'Artversion',
    '/logo/artversion.jpeg',
    'Chicago IL USA',
    'Full-time',
    '2025-05-01',
    '2026-01-01',
    false,
    array[
      'Owned the development of automated Dayforce API integrations for multiple client platforms using JavaScript, PHP, REST APIs, and cron jobs, reducing manual job-posting effort by 70% and increasing cross-platform publishing reliability.',
      'Built secure Chrome and Safari extensions to bridge disconnected systems across multiple client environments, reducing data transfer time by 90% and improving workflow efficiency for business operations.',
      'Drove accessibility improvements across multiple React-based client applications by implementing ADA, WCAG, and ARIA standards, increasing accessible reach by 40% and strengthening overall user engagement.',
      'Developed and launched a high-performance web platform on WordPress VIP, engineering fluid, interactive UI components with GSAP web animations, which increased user time-on-page by 35% and significantly enhanced visual engagement.'
    ],
    array['JavaScript','PHP','React','REST APIs','Dayforce API','Chrome/Safari Extensions','WordPress VIP','GSAP','ADA/WCAG/ARIA','Cron Jobs'],
    1,
    true,
    now()
  ),
  (
    'Software Developer',
    'Artarray',
    '/logo/artarray_logo.jpeg',
    'Pune MH India',
    'Full-time',
    '2020-02-01',
    '2023-06-01',
    false,
    array[
      'Owned the development of a high-traffic course registration platform using React, Node.js, JavaScript (ES6+), and RESTful APIs, improving enrollment workflow efficiency by 35% and delivering a secure end-to-end user experience.',
      'Architected and implemented distributed business logic for schedule conflict detection, prerequisite validation, and automated waitlist management, reducing registration errors by 40% and increasing successful enrollment processing by 30%.',
      'Improved platform reliability and scalability by integrating Firebase Authentication, deploying Dockerized services on AWS, and building centralized monitoring with AWS OpenSearch, reducing incident resolution time by 50% and supporting 99.9% availability during peak registration cycles.'
    ],
    array['React','Node.js','JavaScript (ES6+)','RESTful APIs','Firebase','Docker','AWS','AWS OpenSearch'],
    2,
    true,
    now()
  ),
  (
    'Freelance Web Developer',
    'Freelance',
    '/logo/freelance.jpeg',
    'Belgaum KA India',
    'Freelance',
    '2020-03-01',
    '2022-02-01',
    false,
    array[
      'Owned end-to-end web application development for multiple freelance clients, driving requirements gathering, system design, implementation, deployment, and post-launch support for scalable, business-critical solutions.',
      'Developed dynamic, responsive front-end systems using React, Angular, JavaScript (ES6+), HTML5/CSS3, REST APIs, and state management, improving performance by 35% and delivering consistent cross-device experiences.',
      'Leveraged analytics integration and event tracking to analyze user behavior and conversion funnels, guiding feature enhancements that boosted engagement by 25%.'
    ],
    array['React','Angular','JavaScript (ES6+)','HTML5','CSS3','REST APIs','State Management','Web Analytics'],
    3,
    true,
    now()
  ),
  (
    'Webmaster',
    'IEEE Bangalore Young Professionals',
    '/logo/ieeeyp.jpeg',
    'Bangalore KA India',
    'Internship',
    '2020-11-01',
    '2021-09-01',
    false,
    array[
      'Secured this competitive internship by winning the IEEE YP Online Website Contest, showcasing strong technical and web design capabilities.',
      'Developed and launched the official IEEE Bangalore Young Professionals website, creating a responsive and modern digital hub for organizational engagement.',
      'Engineered the flagship event platform for the Young Professionals Global Summit 2020, delivering a high-performance web experience for global attendees.'
    ],
    array['HTML','CSS','JavaScript','Web Design','Responsive UI','Web Performance Optimization'],
    4,
    true,
    now()
  );
