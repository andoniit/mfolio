"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AnimatedIntroText from "./AnimatedIntroText";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const experiences = [
  {
    company: "Artversion",
    logo: "/logo/artversion.jpeg",
    roles: [
      {
        title: "Software Developer",
        duration: "May 2025 – Jan 2026",
        type: "Full-Time",
        location: "Chicago IL USA",
        bullets: [
          "Owned the development of automated Dayforce API integrations for multiple client platforms using JavaScript, PHP, REST APIs, and cron jobs, reducing manual job-posting effort by 70% and increasing cross-platform publishing reliability.",
          "Built secure Chrome and Safari extensions to bridge disconnected systems across multiple client environments, reducing data transfer time by 90% and improving workflow efficiency for business operations.",
          "Drove accessibility improvements across multiple React-based client applications by implementing ADA, WCAG, and ARIA standards, increasing accessible reach by 40% and strengthening overall user engagement.",
          "Developed and launched a high-performance web platform on WordPress VIP, engineering fluid, interactive UI components with GSAP web animations, which increased user time-on-page by 35% and significantly enhanced visual engagement."
        ],
        techStack: "JavaScript, PHP, React, REST APIs, Dayforce API, Chrome/Safari Extensions, WordPress VIP, GSAP, ADA/WCAG/ARIA, Cron Jobs"
      }
    ]
  },
  {
    company: "Artarray",
    logo: "/logo/artarray_logo.jpeg",
    roles: [
      {
        title: "Software Developer",
        duration: "Feb 2020 – Jun 2023",
        type: "Full-Time",
        location: "Pune MH India",
        bullets: [
          "Owned the development of a high-traffic course registration platform using React, Node.js, JavaScript (ES6+), and RESTful APIs, improving enrollment workflow efficiency by 35% and delivering a secure end-to-end user experience.",
          "Architected and implemented distributed business logic for schedule conflict detection, prerequisite validation, and automated waitlist management, reducing registration errors by 40% and increasing successful enrollment processing by 30%.",
          "Improved platform reliability and scalability by integrating Firebase Authentication, deploying Dockerized services on AWS, and building centralized monitoring with AWS OpenSearch, reducing incident resolution time by 50% and supporting 99.9% availability during peak registration cycles."
        ],
        techStack: "React, Node.js, JavaScript (ES6+), RESTful APIs, Firebase, Docker, AWS, AWS OpenSearch"
      }
    ]
  },
  {
    company: "Freelance",
    logo: "/logo/freelance.jpeg",
    roles: [
      {
        title: "Freelance Web Developer",
        duration: "Mar 2020 – Feb 2022",
        type: "Freelance",
        location: "Belgaum KA India",
        bullets: [
          "Owned end-to-end web application development for multiple freelance clients, driving requirements gathering, system design, implementation, deployment, and post-launch support for scalable, business-critical solutions.",
          "Developed dynamic, responsive front-end systems using React, Angular, JavaScript (ES6+), HTML5/CSS3, REST APIs, and state management, improving performance by 35% and delivering consistent cross-device experiences.",
          "Leveraged analytics integration and event tracking to analyze user behavior and conversion funnels, guiding feature enhancements that boosted engagement by 25%."
        ],
        techStack: "React, Angular, JavaScript (ES6+), HTML5, CSS3, REST APIs, State Management, Web Analytics"
      }
    ]
  },
  {
    company: "IEEE Bangalore Young Professionals",
    logo: "/logo/ieeeyp.jpeg",
    roles: [
      {
        title: "Webmaster",
        duration: "Nov 2020 – Sep 2023",
        type: "Intern",
        location: "Bangalore KA India",
        bullets: [
          "Secured this competitive internship by winning the IEEE YP Online Website Contest, showcasing strong technical and web design capabilities.",
          "Developed and launched the official IEEE Bangalore Young Professionals website, creating a responsive and modern digital hub for organizational engagement.",
          "Engineered the flagship event platform for the Young Professionals Global Summit 2020, delivering a high-performance web experience for global attendees."
        ],
        techStack: "HTML, CSS, JavaScript, Web Design, Responsive UI, Web Performance Optimization"
      }
    ]
  }
];

const Experience = () => {
  const [expandedRoles, setExpandedRoles] = useState({});

  const toggleRole = (cIdx, rIdx) => {
    const key = `${cIdx}-${rIdx}`;
    setExpandedRoles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    const companies = document.querySelectorAll(".company-block");
    companies.forEach((company, index) => {
      gsap.fromTo(
        company,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.1, // Stagger slightly
          ease: "power2.out",
          scrollTrigger: {
            trigger: company,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section id="experience" aria-label="Experience">
      <div style={{ height: "15vh" }} />

      <div className="experience-wrapper">
        <div className="experienceTitle">
          <h2>
            <AnimatedIntroText text="Experience" />
          </h2>
        </div>

        <div className="experience-container">
          {experiences.map((exp, cIdx) => (
            <div className="company-block glass-card" key={cIdx}>
              <div className="company-header">
                <img src={exp.logo} alt={`${exp.company} logo`} className="company-logo" />
                <h3 className="company-name">{exp.company}</h3>
              </div>
              
              <div className="roles-list">
                {exp.roles.map((role, rIdx) => {
                  const isLast = rIdx === exp.roles.length - 1;
                  const isExpanded = expandedRoles[`${cIdx}-${rIdx}`];
                  
                  return (
                    <div className="role-item" key={rIdx}>
                      {/* Branch connector */}
                      <div className="tree-branch"></div>
                      
                      {/* Vertical line continuing to next role */}
                      {!isLast && <div className="tree-vertical-line"></div>}
                      
                      <div className="role-content">
                        <div 
                          className="role-header-clickable" 
                          onClick={() => toggleRole(cIdx, rIdx)}
                          aria-expanded={isExpanded}
                        >
                          <div>
                            <h4 className="role-title">
                              {role.title}
                              <svg className="verified-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM16.7071 9.70711C17.0976 9.31658 17.0976 8.68342 16.7071 8.29289C16.3166 7.90237 15.6834 7.90237 15.2929 8.29289L10.5 13.0858L8.70711 11.2929C8.31658 10.9024 7.68342 10.9024 7.29289 11.2929C6.90237 11.6834 6.90237 12.3166 7.29289 12.7071L9.79289 15.2071C10.1834 15.5976 10.8166 15.5976 11.2071 15.2071L16.7071 9.70711Z" fill="#22C55E"/>
                              </svg>
                            </h4>
                            <p className="role-meta">
                              {role.duration} · {role.location} · {role.type}
                            </p>
                          </div>
                          <div className={`dropdown-icon ${isExpanded ? "open" : ""}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                        </div>
                        
                        <div className={`role-details ${isExpanded ? "expanded" : ""}`}>
                          <div className="role-details-inner">
                            <ul className="role-bullets">
                              {role.bullets.map((bullet, bIdx) => (
                                <li key={bIdx}>{bullet}</li>
                              ))}
                            </ul>
                            
                            <div className="tech-stack">
                              <span className="tech-label">Tech Stack:</span> {role.techStack}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @font-face {
          font-family: 'Coolvetica';
          src: url('/fonts/Coolvetica Rg.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }

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

      <style jsx>{`
        #experience {
          padding-bottom: 100px;
        }

        .experience-wrapper {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .experienceTitle {
          font-size: 6em;
          text-align: center;
          margin-bottom: 3rem;
        }
        .experienceTitle h2 {
          margin: 0;
          font-family: 'Coolvetica', sans-serif;
          letter-spacing: 0.05em;
          font-size: inherit;
          font-weight: inherit;
        }
        
        .experience-container {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          font-family: 'Coolvetica', sans-serif;
          letter-spacing: 0.05em;
        }

        .company-block {
          will-change: transform, opacity;
        }

        /* Glassmorphism Card Styles */
        .glass-card {
          background: rgba(120, 120, 120, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(120, 120, 120, 0.2);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
          border-radius: 20px;
          padding: 2rem 2.5rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .glass-card:hover {
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.08);
        }

        .company-header {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          z-index: 2;
          margin-bottom: 1rem;
        }

        .company-logo {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          background-color: var(--color-black);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .company-name {
          font-size: 1.3rem;
          font-weight: 500;
          color: var(--color-white);
          margin: 0;
        }

        .roles-list {
          margin-left: 24px;
          margin-top: -8px;
        }

        .role-item {
          position: relative;
          padding-left: 36px;
          padding-bottom: 1.5rem;
        }
        
        .role-item:last-child {
          padding-bottom: 0;
        }

        .tree-branch {
          position: absolute;
          left: 0;
          top: 0;
          width: 24px;
          height: 38px;
          border-left: 2px solid rgba(120, 120, 120, 0.4);
          border-bottom: 2px solid rgba(120, 120, 120, 0.4);
          border-bottom-left-radius: 12px;
        }

        .tree-vertical-line {
          position: absolute;
          left: 0;
          top: 38px;
          bottom: 0;
          width: 2px;
          background-color: rgba(120, 120, 120, 0.4);
        }

        .role-content {
          padding-top: 25px;
        }

        .role-header-clickable {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          cursor: pointer;
          user-select: none;
          padding: 8px 12px;
          margin: -8px -12px;
          border-radius: 12px;
          transition: background-color 0.2s ease;
        }

        .role-header-clickable:hover {
          background-color: rgba(120, 120, 120, 0.05);
        }

        .role-title {
          font-size: 1.7rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
          color: var(--color-white);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .verified-icon {
          flex-shrink: 0;
        }

        .role-meta {
          font-size: 0.95rem;
          color: var(--color-grey);
          margin: 0;
        }

        .dropdown-icon {
          color: var(--color-grey);
          transition: transform 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          margin-top: 4px;
        }

        .dropdown-icon.open {
          transform: rotate(180deg);
        }

        .role-details {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.4s ease-in-out, opacity 0.4s ease-in-out, margin-top 0.4s ease-in-out;
          opacity: 0;
          margin-top: 0;
        }

        .role-details.expanded {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-top: 1rem;
        }

        .role-details-inner {
          overflow: hidden;
          padding: 0 4px;
        }

        .role-bullets {
          list-style-type: disc;
          padding-left: 18px;
          margin: 0 0 1rem 0;
        }

        .role-bullets li {
          margin-bottom: 8px;
          line-height: 1.6;
          color: var(--color-white);
          font-size: 1rem;
        }

        .tech-stack {
          font-size: 0.95rem;
          color: var(--color-grey);
          margin-top: 1rem;
          line-height: 1.5;
        }

        .tech-label {
          font-weight: 600;
          color: var(--color-white);
        }

        @media (max-width: 768px) {
          .experience-wrapper {
            padding: 0 1.5rem;
          }

          .experienceTitle {
            font-size: 4rem;
            margin-bottom: 2rem;
          }
          
          .glass-card {
            padding: 1.5rem;
          }

          .company-logo {
            width: 44px;
            height: 44px;
          }
          
          .roles-list {
            margin-left: 21px;
          }
          
          .role-title {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </section>
  );
};

export default Experience;
