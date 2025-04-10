"use client";

import { useEffect } from "react";
import Framer from "@/components/Framer";

const Timeline = () => {
  useEffect(() => {
    const timelines = document.querySelectorAll(".timeline__right");
    const trackers = document.querySelectorAll(".timeline__tracker");

    const onScroll = () => {
      timelines.forEach((timeline, i) => {
        const content = timeline.querySelector(".timeline__content");
        if (trackers[i].offsetTop > 0) {
          content.classList.add("animate-on-scroll");
        } else {
          content.classList.remove("animate-on-scroll");
        }
        timeline.style.background = `linear-gradient(
          180deg, 
          #ff3636 0%, 
          #ff3636 0%, 
          #ff3636 ${trackers[i].offsetTop + 5}px, 
          black ${trackers[i].offsetTop + 5}px, 
          black 100%
        )`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>
      <div style={{ height: "30vh" }}></div>
      
     
      <div className="experienceTitle">
            <h1>Experience</h1>
          </div>
      <div className="experience-container">
      
        {/* LEFT COLUMN: Voluntary Section */}
        <div className="voluntary-section">
          
          <div className="voluntaryRoles">
            Voluntary Roles
          </div>

          {/* Updated volunteer items */}
          <div className="voluntary-item">
            <h3>Design Head</h3>
            <h4>Indian Student Association – Illinois Tech | Aug 2023 – Jan 2025 · 1 yr 6 mos</h4>
            <p>I served as Design Head for 3 semesters at ISA@IIT Chicago. I was also offered a 4th tenure as Design Head, but as I was in the final semester of my master's, I had to decline the offer. In this role, I contributed significantly to art and culture by making and filming videos, managing the design team, and collaborating closely with the photography team.</p>
          </div>
          
          <div className="voluntary-item">
            <h3>Joint Secretary</h3>
            <h4>IEEE KLS GIT | Dec 2021 – Oct 2022 · 11 mos</h4>
            <p>As Joint Secretary at IEEE KLS GIT, I coordinated internal communications, managed event logistics, and maintained documentation to ensure smooth operation of the team. I played a key role in organizing events and streamlining processes, as detailed in the second image.</p>
          </div>

          <div className="voluntary-item">
            <h3>Webmaster</h3>
            <h4>IEEE KLS GIT | Jan 2020 – Nov 2021 · 1 yr 10 mos</h4>
            <p>As Webmaster at IEEE KLS GIT, I led website maintenance and development initiatives, ensuring the site was both visually appealing and functionally robust. I collaborated with multiple teams to manage content updates and optimize the user experience, following the details provided in the first image.</p>
          </div>

          
        </div>

        {/* RIGHT COLUMN: Timeline (unchanged code) */}
        <div className="timeline-wrapper">
          <div className="timeline">
            {/* ----------------- TIMELINE SECTION 1 (Latest Experience) ----------------- */}
            <div className="timeline__section">
              <div className="timeline__left">
                <div className="timeline__date">
                  {/* ... date info if any ... */}
                </div>
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
                    <h3>Software Developer</h3>
                    <h4>Artarray (Full-Time) | Jul 2022 – Jun 2023</h4>
                    <ul>
                      <li>Collaborated with 3 cross-functional teams to develop and design web applications, achieving a 15% improvement in user satisfaction scores and a 25% reduction in post-launch issues.</li>
                      <li>Identified and mitigated challenges in the development process, boosting efficiency and effectiveness. Implemented solutions led to a 20% reduction in development time and improved overall project success rates.</li>
                      <li>Utilized investigative reasoning skills for troubleshooting, ensuring swift issue resolution and optimal performance of web applications, and led software solutions implementations, ensuring a seamless transition from development to production environments.</li>
                    </ul>
                    <h4>Tech Stack</h4>
                    <p>React, Angular, Three.js, React Three Fiber, Leaflet, MongoDB, AWS</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ... TIMELINE SECTION 2 ... */}
            <div className="timeline__section">
              <div className="timeline__left">
                <div className="timeline__date">
                  {/* ... date info if any ... */}
                </div>
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
                    <h3>Software Engineer Intern</h3>
                    <h4>Artarray (Intern) | Feb 2020 – Jul 2022</h4>
                    <ul>
                      <li>Served as a Software Engineer Intern at Artarray, honing my skills in front-end and back-end development while collaborating on various internal projects.</li>
                      <li>Played a pivotal role in enhancing user interfaces for optimal engagement, showcasing a holistic approach to software development.</li>
                    </ul>
                    <h4>Tech Stack</h4>
                    <p>Adobe XD, WordPress, Squarespace, Angular</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ... TIMELINE SECTION 3 ... */}
            <div className="timeline__section">
              <div className="timeline__left">
                <div className="timeline__date">
                  {/* ... date info if any ... */}
                </div>
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
                    <h3>Freelance Web Developer</h3>
                    <h4>Mar 2020 – Feb 2022</h4>
                    <p>
                      Freelanced for multiple companies (MyNexAlloys, Artarray, Studio 89, etc.),
                      providing web solutions that ranged from front-end design to full-stack
                      implementations. This experience paved the way to my internship at Artarray.
                    </p>
                    <h4>Tech Stack</h4>
                    <p>React, WordPress, Angular, Social Media Marketing</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ... TIMELINE SECTION 4 ... */}
            <div className="timeline__section">
              <div className="timeline__left">
                <div className="timeline__date">
                  {/* ... date info if any ... */}
                </div>
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
                    <h3>Webmaster</h3>
                    <h4>IEEE Bangalore Young Professionals (Intern) | Nov 2020 – Sep 2023</h4>
                    <p>
                      Developed and maintained the IEEE Bangalore Young Professionals website,
                      including the flagship event site for the Young Professionals Global
                      Summit 2020. Recognized at the summit in the presence of His Highness
                      Yaduveer Wadiyar, Maharaja of Mysuru. Secured this internship by winning
                      the YP Online Website Contest.
                    </p>
                    <h4>Tech Stack</h4>
                    <p>HTML, CSS, JavaScript</p>
                  </div>
                </div>
              </div>
            </div>
            {/* ... Add more timeline sections as needed ... */}
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
        /* NEW GRID WRAPPER for left (volunteer) and right (timeline) */
        .experience-container {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .voluntary-section {
          
        }
        .experienceTitle {
          font-size: 6em;
          font-family: var(--font-shadows);
          text-align: left;
          margin-bottom: -4rem;
          margin-left: 14rem;
        }
        .voluntaryRoles {
          font-size: 3em;
          margin-bottom: 1rem;
          margin-top: 7rem;

          color: var(--color-white);
          font-family: Tajawal;
        }
        @media (max-width: 768px) {
          .experienceTitle {
            font-size: 3em;
            margin-left: 1rem;
            margin-bottom: -10rem;
          }
          .voluntaryRoles {
            font-size: 2em;
          }
        }
        .voluntary-item {
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--color-grey);
          padding-bottom: 1rem;
        }
        .voluntary-item h3 {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: var(--color-white);
          font-family: Tajawal;
        }
        .voluntary-item h4 {
          font-size: 1rem;
          font-weight: 500;
          color: #ff3636;
          margin-bottom: 0.5rem;
          font-family: Tajawal;
        }
        .voluntary-item p {
          font-size: 1rem;
          color: var(--color-grey);
          margin-top: 0.25rem;
        }

        .timeline-wrapper {
          /* Just a wrapper around your existing .timeline to preserve layout */
        }

        /* Existing timeline and other styles remain unchanged below */
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
          font-family: 'Tajawal';
        }
        .timeline__left,
        .timeline__middle,
        .timeline__tracker {
          position: sticky;
          top: var(--sticky-top-pos);
        }
        .timeline__left,
        .timeline__middle {
          margin-bottom: var(--buffer);
        }
        .timeline__right {
          background: linear-gradient(
            180deg,
            red 0%,
            red 0%,
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
          font-family: 'Tajawal';
        }
        .animate-on-scroll {
          color: var(--color-white);
        }

        /* Styles for Title, Sub Title and Tech Stack details */
        .timeline__content h3 {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .timeline__content h4:first-of-type {
          font-size: 1rem;
          font-weight: 500;
          color: #ff3636;
          margin-bottom: 0.5rem;
        }
        .timeline__content h4:nth-of-type(2) {
          font-size: 1.15rem;
          font-weight: 500;
          color: var(--color-white);
          margin-top: 1rem;
          margin-bottom: 0.25rem;
        }
        .timeline__content h4:nth-of-type(2) + p {
          font-size: 1rem;
          color: var(--color-grey);
          font-style: italic;
          margin-top: 0.25rem;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .experience-container {
            display: flex;
            flex-direction: column;
            padding: 0 10px;
            
          }
          
          .voluntary-item h3{
          font-size:1.5rem
          }
          .timeline__section {
            grid-template-columns: 1fr;
            grid-gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .timeline__right > div {
            padding-left: 10px;
            margin-bottom: -10em;
          }
          .timeline__content h3 {
            font-size: 1.5rem;
          }
          .timeline__content h4:first-of-type {
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
      `}</style>
    </div>
  );
};

export default Timeline;