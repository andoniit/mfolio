'use client';

import { useRef, useEffect } from 'react';
import styles from './InteractiveSection.module.css';
import Framer from "@/components/Framer";


export default function InteractiveSection() {
  const path = useRef<SVGPathElement>(null);
  let progress = 0;
  let x = 0.5;
  let time = Math.PI / 2;
  let reqId: number | null = null;

  useEffect(() => {
    setPath(progress);
  }, []);

  const setPath = (progress: number) => {
    const width = window.innerWidth * 0.7;
    if (path.current) {
      path.current.setAttributeNS(null, "d", `M0 250 Q${width * x} ${250 + progress}, ${width} 250`);
    }
  };

  const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

  const manageMouseEnter = () => {
    if (reqId) {
      cancelAnimationFrame(reqId);
      resetAnimation();
    }
  };

  const manageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { movementY, clientX } = e;
    if (!path.current) return;
    const pathBound = path.current.getBoundingClientRect();
    x = (clientX - pathBound.left) / pathBound.width;
    progress += movementY;
    setPath(progress);
  };

  const manageMouseLeave = () => {
    animateOut();
  };

  const animateOut = () => {
    const newProgress = progress * Math.sin(time);
    progress = lerp(progress, 0, 0.025);
    time += 0.2;
    setPath(newProgress);
    if (Math.abs(progress) > 0.75) {
      reqId = requestAnimationFrame(animateOut);
    } else {
      resetAnimation();
    }
  };

  const resetAnimation = () => {
    time = Math.PI / 2;
    progress = 0;
  };

  return (
    <div className={styles.container}>
      <div className={styles.body}>
      <Framer>
      <div className={styles.description}>
      
      <h1>Who am I ?</h1>
      
      </div>
      </Framer>
        <div className={styles.line}>
          <div
            onMouseEnter={manageMouseEnter}
            onMouseMove={manageMouseMove}
            onMouseLeave={manageMouseLeave}
            className={styles.box}
          ></div>
          <svg>
            <path ref={path}></path>
          </svg>
        </div>

        <div className={styles.description}>
          <p>
         I’m a Software Development Engineer with experience building and owning production-grade, full-stack web applications from design through deployment. I enjoy working on problems that sit at the intersection of clean architecture, scalable systems, and user-focused engineering.

My background spans frontend and backend development, where I’ve built modular UI systems with React, designed RESTful APIs and backend workflows using Node.js, and deployed reliable, containerized services on AWS. I care deeply about performance, security, accessibility, and maintainability, and I’ve led features that improved user satisfaction, reduced defects, and supported stable production releases.

I’ve worked across the full software lifecycle—requirements analysis, system design, implementation, testing, deployment, and observability—collaborating closely with designers, engineers, and QA to ship reliable systems at scale. I’m comfortable owning features end-to-end and diving deep into debugging, optimization, and edge-case handling.

Currently, I’m seeking Software Development Engineer roles where I can contribute to scalable, high-impact systems, learn from strong engineering teams, and continue growing as an engineer who builds things that last.
          </p>

          
        </div>
        <div className={styles.tagsContainer}>
        <p>Beyond the code and cloud, there’s a timeline of passion projects, creative chaos, and side quests that shaped who I am.


In 2020, I went full gamer mode—livestreaming video games on YouTube during the COVID pandemic (peak lockdown vibes). I’ve worked with an ad agency, a news channel, and even a political party in India, getting hands-on experience with storytelling, media, and impact.



I’ve also worked as a software engineer, collaborated with friends to build robots and drones, and yes—I absolutely snack on chips and soda while doing all this. I was an active member of the IEEE Student Branch at KLS GIT, started a Photography Club during my undergrad, and served as the Design Head for three semesters at IIT Chicago.




Oh—and one more thing: I can Procreate (yes, the iPad app—designing, illustrating, and occasionally doodling nonsense that turns out kinda cool).
</p>
        </div>
      </div>
    </div>
  );
}