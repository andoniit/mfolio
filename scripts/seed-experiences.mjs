import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const seed = [
  {
    title: "Software Developer",
    company: "Artversion",
    logo_url: "/logo/artversion.jpeg",
    location: "Chicago IL USA",
    employment_type: "Full-time",
    start_date: "2025-05-01",
    end_date: "2026-01-01",
    is_current: false,
    highlights: [
      "Owned the development of automated Dayforce API integrations for multiple client platforms using JavaScript, PHP, REST APIs, and cron jobs, reducing manual job-posting effort by 70% and increasing cross-platform publishing reliability.",
      "Built secure Chrome and Safari extensions to bridge disconnected systems across multiple client environments, reducing data transfer time by 90% and improving workflow efficiency for business operations.",
      "Drove accessibility improvements across multiple React-based client applications by implementing ADA, WCAG, and ARIA standards, increasing accessible reach by 40% and strengthening overall user engagement.",
      "Developed and launched a high-performance web platform on WordPress VIP, engineering fluid, interactive UI components with GSAP web animations, which increased user time-on-page by 35% and significantly enhanced visual engagement.",
    ],
    skills: [
      "JavaScript", "PHP", "React", "REST APIs", "Dayforce API",
      "Chrome/Safari Extensions", "WordPress VIP", "GSAP", "ADA/WCAG/ARIA", "Cron Jobs",
    ],
    sort_order: 1,
    published: true,
    published_at: new Date().toISOString(),
  },
  {
    title: "Software Developer",
    company: "Artarray",
    logo_url: "/logo/artarray_logo.jpeg",
    location: "Pune MH India",
    employment_type: "Full-time",
    start_date: "2020-02-01",
    end_date: "2023-06-01",
    is_current: false,
    highlights: [
      "Owned the development of a high-traffic course registration platform using React, Node.js, JavaScript (ES6+), and RESTful APIs, improving enrollment workflow efficiency by 35% and delivering a secure end-to-end user experience.",
      "Architected and implemented distributed business logic for schedule conflict detection, prerequisite validation, and automated waitlist management, reducing registration errors by 40% and increasing successful enrollment processing by 30%.",
      "Improved platform reliability and scalability by integrating Firebase Authentication, deploying Dockerized services on AWS, and building centralized monitoring with AWS OpenSearch, reducing incident resolution time by 50% and supporting 99.9% availability during peak registration cycles.",
    ],
    skills: [
      "React", "Node.js", "JavaScript (ES6+)", "RESTful APIs", "Firebase", "Docker", "AWS", "AWS OpenSearch",
    ],
    sort_order: 2,
    published: true,
    published_at: new Date().toISOString(),
  },
  {
    title: "Freelance Web Developer",
    company: "Freelance",
    logo_url: "/logo/freelance.jpeg",
    location: "Belgaum KA India",
    employment_type: "Freelance",
    start_date: "2020-03-01",
    end_date: "2022-02-01",
    is_current: false,
    highlights: [
      "Owned end-to-end web application development for multiple freelance clients, driving requirements gathering, system design, implementation, deployment, and post-launch support for scalable, business-critical solutions.",
      "Developed dynamic, responsive front-end systems using React, Angular, JavaScript (ES6+), HTML5/CSS3, REST APIs, and state management, improving performance by 35% and delivering consistent cross-device experiences.",
      "Leveraged analytics integration and event tracking to analyze user behavior and conversion funnels, guiding feature enhancements that boosted engagement by 25%.",
    ],
    skills: [
      "React", "Angular", "JavaScript (ES6+)", "HTML5", "CSS3", "REST APIs", "State Management", "Web Analytics",
    ],
    sort_order: 3,
    published: true,
    published_at: new Date().toISOString(),
  },
  {
    title: "Webmaster",
    company: "IEEE Bangalore Young Professionals",
    logo_url: "/logo/ieeeyp.jpeg",
    location: "Bangalore KA India",
    employment_type: "Internship",
    start_date: "2020-11-01",
    end_date: "2021-09-01",
    is_current: false,
    highlights: [
      "Secured this competitive internship by winning the IEEE YP Online Website Contest, showcasing strong technical and web design capabilities.",
      "Developed and launched the official IEEE Bangalore Young Professionals website, creating a responsive and modern digital hub for organizational engagement.",
      "Engineered the flagship event platform for the Young Professionals Global Summit 2020, delivering a high-performance web experience for global attendees.",
    ],
    skills: ["HTML", "CSS", "JavaScript", "Web Design", "Responsive UI", "Web Performance Optimization"],
    sort_order: 4,
    published: true,
    published_at: new Date().toISOString(),
  },
];

for (const s of seed) s.category = "work";

const volunteerSeed = [
  {
    title: "JavaScript Developer",
    company: "Carboncopies Foundation",
    company_url: "https://roadmap.carboncopies.org",
    start_date: null,
    end_date: null,
    is_current: true,
    description:
      "The Carboncopies Foundation is a nonprofit dedicated to advancing the science and development of Whole Brain Emulation. As a JavaScript Developer, I engineer their interactive web application (roadmap.carboncopies.org) to visually track the complex research milestones required for this mission. This platform successfully translates highly technical data into an accessible, engaging roadmap for both the scientific community and the public.",
    sort_order: 1,
    category: "volunteer",
    published: true,
    published_at: new Date().toISOString(),
  },
  {
    title: "Design Head",
    company: "Indian Student Association – Illinois Tech",
    start_date: "2023-08-01",
    end_date: "2025-01-01",
    is_current: false,
    description:
      "I served as Design Head for 3 semesters at ISA@IIT Chicago. I was also offered a 4th tenure as Design Head, but as I was in the final semester of my master's, I had to decline the offer. In this role, I contributed significantly to art and culture by making and filming videos, managing the design team, and collaborating closely with the photography team.",
    sort_order: 2,
    category: "volunteer",
    published: true,
    published_at: new Date().toISOString(),
  },
  {
    title: "Joint Secretary",
    company: "IEEE KLS GIT",
    start_date: "2021-12-01",
    end_date: "2022-10-01",
    is_current: false,
    description:
      "As Joint Secretary at IEEE KLS GIT, I coordinated internal communications, managed event logistics, and maintained documentation to ensure smooth operation of the team. I played a key role in organizing events and streamlining processes.",
    sort_order: 3,
    category: "volunteer",
    published: true,
    published_at: new Date().toISOString(),
  },
  {
    title: "Webmaster",
    company: "IEEE KLS GIT",
    start_date: "2020-01-01",
    end_date: "2021-11-01",
    is_current: false,
    description:
      "As Webmaster at IEEE KLS GIT, I led website maintenance and development initiatives, ensuring the site was both visually appealing and functionally robust. I collaborated with multiple teams to manage content updates and optimize the user experience.",
    sort_order: 4,
    category: "volunteer",
    published: true,
    published_at: new Date().toISOString(),
  },
];

const allSeed = [...seed, ...volunteerSeed];

async function main() {
  const probe = await supabase.from("experiences").select("id").limit(1);
  if (probe.error) {
    console.error("TABLE_MISSING:", probe.error.message);
    process.exit(2);
  }

  const companies = [...new Set(allSeed.map((s) => s.company))];
  const del = await supabase.from("experiences").delete().in("company", companies);
  if (del.error) {
    console.error("DELETE_FAILED:", del.error.message);
    process.exit(1);
  }

  const ins = await supabase.from("experiences").insert(allSeed).select("id, company, category");
  if (ins.error) {
    console.error("INSERT_FAILED:", ins.error.message);
    process.exit(1);
  }

  console.log(`SEEDED ${ins.data.length} rows:`);
  ins.data.forEach((r) => console.log(` - [${r.category}] ${r.company}`));
}

main();
