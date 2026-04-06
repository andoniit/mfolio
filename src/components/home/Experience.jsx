"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const Experience = () => {
  useEffect(() => {
    // --- 1. Original Custom Scroll Logic (Gradient Timeline Tracker) ---
    const timelines = document.querySelectorAll(".timeline__right");
    const trackers = document.querySelectorAll(".timeline__tracker");

    const onScroll = () => {
      timelines.forEach((timeline, i) => {
        const content = timeline.querySelector(".timeline__content");
        if (trackers[i] && trackers[i].offsetTop > 0) {
          content.classList.add("animate-on-scroll");
        } else if (content) {
          content.classList.remove("animate-on-scroll");
        }
        
        if (trackers[i]) {
          timeline.style.background = `linear-gradient(
            180deg, 
            #ea3e3e 0%, 
            #ea3e3e 0%, 
            #ea3e3e ${trackers[i].offsetTop + 5}px, 
            black ${trackers[i].offsetTop + 5}px, 
            black 100%
          )`;
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // --- 2. GSAP Scroll Entry Animations ---
    
    // Animate the main Experience Title
    gsap.fromTo(
      ".experienceTitle h2",
      { opacity: 0, y: -50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".experienceTitle",
          start: "top 85%",
        },
      }
    );

    // Animate the Voluntary Roles Heading
    gsap.fromTo(
      ".voluntaryRoles",
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".voluntaryRoles",
          start: "top 85%",
        },
      }
    );

    // Animate each Voluntary Item individually
    const voluntaryItems = document.querySelectorAll(".voluntary-item");
    voluntaryItems.forEach((item) => {
      gsap.fromTo(
        item,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none none", // Plays once when scrolled into view
          },
        }
      );
    });

    // Animate each Timeline Content box
    const timelineContents = document.querySelectorAll(".timeline__content");
    timelineContents.forEach((content) => {
      gsap.fromTo(
        content,
        { opacity: 0, x: 50 }, // Slides in slightly from the right
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: content,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    // Cleanup listeners and ScrollTriggers on unmount
    return () => {
      window.removeEventListener("scroll", onScroll);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section id="experience" aria-label="Experience">
      <div style={{ height: "30vh" }} />

      <div className="experienceTitle">
        <h2>Experience</h2>
      </div>
      <div className="experience-container">
        {/* LEFT COLUMN: Voluntary Section */}
        <div className="voluntary-section">
          <div className="voluntaryRoles">Voluntary Roles</div>
          
          <div className="voluntary-item">
            <h4>Javascript Developer</h4>
            <h5>Carboncopies Foundation</h5>
            <p>
              The Carboncopies Foundation is a nonprofit dedicated to advancing the science and
              development of Whole Brain Emulation. As a JavaScript Developer, I engineer their
              interactive web application (
              <a href="https://roadmap.carboncopies.org/" target="_blank" rel="noopener noreferrer">
                roadmap.carboncopies.org
              </a>
              ) to visually track the complex research milestones required for this mission. This
              platform successfully translates highly technical data into an accessible, engaging
              roadmap for both the scientific community and the public.
            </p>
          </div>
          
          <div className="voluntary-item">
            <h4>Design Head</h4>
            <h5>Indian Student Association – Illinois Tech | Aug 2023 – Jan 2025 · 1 yr 6 mos</h5>
            <p>
              I served as Design Head for 3 semesters at ISA@IIT Chicago. I was also offered a 4th
              tenure as Design Head, but as I was in the final semester of my master's, I had to
              decline the offer. In this role, I contributed significantly to art and culture by
              making and filming videos, managing the design team, and collaborating closely with
              the photography team.
            </p>
          </div>

          <div className="voluntary-item">
            <h4>Joint Secretary</h4>
            <h5>IEEE KLS GIT | Dec 2021 – Oct 2022 · 11 mos</h5>
            <p>
              As Joint Secretary at IEEE KLS GIT, I coordinated internal communications, managed
              event logistics, and maintained documentation to ensure smooth operation of the team.
              I played a key role in organizing events and streamlining processes, as detailed in
              the second image.
            </p>
          </div>

          <div className="voluntary-item">
            <h4>Webmaster</h4>
            <h5>IEEE KLS GIT | Jan 2020 – Nov 2021 · 1 yr 10 mos</h5>
            <p>
              As Webmaster at IEEE KLS GIT, I led website maintenance and development initiatives,
              ensuring the site was both visually appealing and functionally robust. I collaborated
              with multiple teams to manage content updates and optimize the user experience,
              following the details provided in the first image.
            </p>
          </div>
        </div>

        {/* Work history (visual timeline) */}
        <div className="timeline-wrapper">
          <div className="timeline">
            {/* TIMELINE SECTION 1 */}
            <div className="timeline__section">
              <div className="timeline__left">
                <div className="timeline__date"></div>
              </div>
              <div className="timeline__tracker">
                <div className="tracker"></div>
              </div>
              <div className="timeline__middle">
                <div className="timeline__bullet"></div>
              </div>

              <div className="timeline__right">
                <div>
                  <div className="timeline__content">
                    <h4>Software Developer</h4>
                    <h5>Artversion (Full-Time) | May 2025 – Jan 2026</h5>
                    <ul>
                      <li>Owned the development of automated Dayforce API integrations for multiple client platforms using JavaScript, PHP, REST APIs, and cron jobs, reducing manual job-posting effort by 70% and increasing cross-platform publishing reliability.</li>
                      <li>Built secure Chrome and Safari extensions to bridge disconnected systems across multiple client environments, reducing data transfer time by 90% and improving workflow efficiency for business operations.</li>
                      <li>Drove accessibility improvements across multiple React-based client applications by implementing ADA, WCAG, and ARIA standards, increasing accessible reach by 40% and strengthening overall user engagement.</li>
                      <li>Developed and launched a high-performance web platform on WordPress VIP, engineering fluid, interactive UI components with GSAP web animations, which increased user time-on-page by 35% and significantly enhanced visual engagement.</li>
                    </ul>
                    <h5 className="timeline__techLabel">Tech Stack</h5>
                    <p>JavaScript, PHP, React, REST APIs, Dayforce API, Chrome/Safari Extensions, WordPress VIP, GSAP, ADA/WCAG/ARIA, Cron Jobs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE SECTION 2 */}
            <div className="timeline__section">
              <div className="timeline__left">
                <div className="timeline__date"></div>
              </div>
              <div className="timeline__tracker">
                <div className="tracker"></div>
              </div>
              <div className="timeline__middle">
                <div className="timeline__bullet"></div>
              </div>

              <div className="timeline__right">
                <div>
                  <div className="timeline__content">
                    <h4>Software Developer</h4>
                    <h5>Artarray (Full-Time) | Feb 2020 – Jun 2023</h5>
                    <ul>
                      <li>Owned the development of a high-traffic course registration platform using React, Node.js, JavaScript (ES6+), and RESTful APIs, improving enrollment workflow efficiency by 35% and delivering a secure end-to-end user experience.</li>
                      <li>Architected and implemented distributed business logic for schedule conflict detection, prerequisite validation, and automated waitlist management, reducing registration errors by 40% and increasing successful enrollment processing by 30%.</li>
                      <li>Improved platform reliability and scalability by integrating Firebase Authentication, deploying Dockerized services on AWS, and building centralized monitoring with AWS OpenSearch, reducing incident resolution time by 50% and supporting 99.9% availability during peak registration cycles.</li>
                    </ul>
                    <h5 className="timeline__techLabel">Tech Stack</h5>
                    <p>React, Node.js, JavaScript (ES6+), RESTful APIs, Firebase, Docker, AWS, AWS OpenSearch</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE SECTION 3 */}
            <div className="timeline__section">
              <div className="timeline__left">
                <div className="timeline__date"></div>
              </div>
              <div className="timeline__tracker">
                <div className="tracker"></div>
              </div>
              <div className="timeline__middle">
                <div className="timeline__bullet"></div>
              </div>

              <div className="timeline__right">
                <div>
                  <div className="timeline__content">
                    <h4>Freelance Web Developer</h4>
                    <h5>Mar 2020 – Feb 2022</h5>
                    <ul>
                      <li>Owned end-to-end web application development for multiple freelance clients, driving requirements gathering, system design, implementation, deployment, and post-launch support for scalable, business-critical solutions.</li>
                      <li>Developed dynamic, responsive front-end systems using React, Angular, JavaScript (ES6+), HTML5/CSS3, REST APIs, and state management, improving performance by 35% and delivering consistent cross-device experiences.</li>
                      <li>Leveraged analytics integration and event tracking to analyze user behavior and conversion funnels, guiding feature enhancements that boosted engagement by 25%.</li>
                    </ul>
                    <h5 className="timeline__techLabel">Tech Stack</h5>
                    <p>React, Angular, JavaScript (ES6+), HTML5, CSS3, REST APIs, State Management, Web Analytics</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE SECTION 4 */}
            <div className="timeline__section">
              <div className="timeline__left">
                <div className="timeline__date"></div>
              </div>
              <div className="timeline__tracker">
                <div className="tracker"></div>
              </div>
              <div className="timeline__middle">
                <div className="timeline__bullet"></div>
              </div>

              <div className="timeline__right">
                <div>
                  <div className="timeline__content">
                    <h4>Webmaster</h4>
                    <h5>IEEE Bangalore Young Professionals (Intern) | Nov 2020 – Sep 2023</h5>
                    <ul>
                      <li>Secured this competitive internship by winning the IEEE YP Online Website Contest, showcasing strong technical and web design capabilities.</li>
                      <li>Developed and launched the official IEEE Bangalore Young Professionals website, creating a responsive and modern digital hub for organizational engagement.</li>
                      <li>Engineered the flagship event platform for the Young Professionals Global Summit 2020, delivering a high-performance web experience for global attendees.</li>
                    </ul>
                    <h5 className="timeline__techLabel">Tech Stack</h5>
                    <p>HTML, CSS, JavaScript, Web Design, Responsive UI, Web Performance Optimization</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        :root {
          --color-black: white;
          --color-white: black;
          --color-grey: #494949;
          --sticky-top-pos: 30vh;
          --buffer: 5rem;
        }
        html,
        body {
          margin: 0;
          padding: 0;
          background-color: var(--color-black);
          color: var(--color-white);
        }
      `}</style>

      {/* Component-Specific Styles */}
      <style jsx>{`
        .experience-container {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .experienceTitle {
          font-size: 6em;
          font-family: var(--font-sue-ellen), var(--font-shadows), cursive;
          text-align: left;
          margin-bottom: -4rem;
          margin-left: 14rem;
        }
        .experienceTitle h2 {
          margin: 0;
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
        }
        .voluntaryRoles {
          font-size: 3em;
          margin-bottom: 1rem;
          margin-top: 7rem;
          color: var(--color-white);
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .experienceTitle {
            font-size: 4rem;
            margin: 0px;
          }
          .experienceTitle h2 {
            font-size: 4rem;
            margin-left: 1rem !important;
            margin-bottom: 0px !important;
          }
          .voluntaryRoles {
            font-size: 2em;
          }
        }
        .voluntary-item {
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--color-grey);
          padding-bottom: 1rem;
          will-change: transform, opacity;
        }
        .voluntary-item h4 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
          color: var(--color-white);
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        }
        .voluntary-item h5 {
          font-size: 1rem;
          font-weight: 500;
          color: var(--mf-red, #ea3e3e);
          margin: 0 0 0.5rem;
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        }
        .voluntary-item p {
          font-size: 1rem;
          color: var(--color-grey);
          margin-top: 0.25rem;
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        }
        .voluntary-item a {
          font-family: inherit;
        }

        .timeline {
          max-width: 1000px;
          margin: 0 auto;
        }
        .timeline__section {
          display: grid;
          grid-template-columns: auto 5px 50px auto;
          align-items: start;
          position: relative;
        }
        .timeline__left {
          font-size: 1rem;
          text-align: right;
          text-transform: uppercase;
          color: rgb(63, 63, 63);
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        }
        .timeline__left,
        .timeline__middle,
        .timeline__tracker {
          position: sticky;
          top: var(--sticky-top-pos);
        }
        .timeline__right {
          background: linear-gradient(
            180deg,
            #ea3e3e 0%,
            #ea3e3e 0%,
            var(--color-grey) 0%,
            var(--color-grey) 100%
          );
        }
        .timeline__right > div {
          background-color: var(--color-black);
          padding-bottom: var(--buffer);
          padding-left: 45px;
          margin-left: 4px;
        }
        .timeline__date > div:first-child {
          font-size: 1rem;
        }
        .timeline__bullet {
          --bullet-dims: 20px;
          background-color: var(--color-white);
          width: var(--bullet-dims);
          height: var(--bullet-dims);
          border-radius: 50%;
          transform: translateX(calc(var(--bullet-dims) / 2 + 2px));
          float: right;
        }
        .timeline__content {
          font-size: 1rem;
          color: var(--color-grey);
          transition: color 1s cubic-bezier(0, 0.39, 0.58, 1);
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
          will-change: transform, opacity;
        }
        .animate-on-scroll {
          color: var(--color-white);
        }

        .timeline__content h4 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        }
        .timeline__content h5:first-of-type {
          font-size: 1rem;
          font-weight: 500;
          color: var(--mf-red, #ea3e3e);
          margin: 0 0 0.5rem;
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        }
        .timeline__content .timeline__techLabel {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--color-white);
          margin: 1rem 0 0.25rem;
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        }
        .timeline__content .timeline__techLabel + p {
          font-size: 1rem;
          color: var(--color-grey);
          font-style: italic;
          margin-top: 0.25rem;
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        }
        .timeline__content ul,
        .timeline__content li {
          font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        }

        @media (max-width: 768px) {
          .experience-container {
            display: flex;
            flex-direction: column;
            padding: 0 10px;
          }
          .voluntary-item h4 {
            font-size: 1.5rem;
          }
          .timeline__section {
            grid-template-columns: 1fr;
          }
          .timeline__right > div {
            padding-left: 10px;
          }
          .timeline__content h4 {
            font-size: 1.5rem;
          }
          .timeline__content h5:first-of-type {
            font-size: 1.1rem;
          }
          .timeline__content p,
          .timeline__content ul {
            font-size: 0.9rem;
          }
          .timeline__bullet {
            display: none;
          }
          .timeline-wrapper {
            order: 1;
          }
          .voluntary-section {
            order: 2;
          }
        }
        
        .timeline__content ul {
          list-style-type: disc;
          padding-left: 20px;
          margin: 10px 0;
        }
        .timeline__content li {
          margin-bottom: 10px;
          line-height: 1.5;
        }
      `}</style>
    </section>
  );
};

export default Experience;