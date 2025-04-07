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
          I’m a designer at heart, a developer by trade, and a creative thinker by default. With 3 years of professional experience in web and cloud development, I thrive at the intersection of code, design, and interaction. My journey blends scalable product building with a curiosity for solving real-world problems, and lately, I’ve been diving into the immersive world of 3D web experiences.
          <br/>
          <br/>
          Currently pursuing my Master’s in Computer Science at IIT Chicago, I’m based in the vibrant city of Chicago—where I fuel my days with lines of code and my weekends with camera gear. I’m passionate about AI/ML, have tinkered with ChatGPT APIs, and am particularly drawn to integration engineering and seamless system design. Oh—and when I’m not deep in tech, you’ll probably find me editing videos, shooting cinematic clips, or planning the next visual story.
          </p>
          <br/>
          
        </div>
        <div className={styles.tagsContainer}>
        <h1>More About Me (a.k.a. The Side Quests)</h1>
        <p>Beyond the code and cloud, there’s a timeline of passion projects, creative chaos, and side quests that shaped who I am.
<br/>
<br/>

In 2020, I went full gamer mode—livestreaming video games on YouTube during the COVID pandemic (peak lockdown vibes). I’ve worked with an ad agency, a news channel, and even a political party in India, getting hands-on experience with storytelling, media, and impact.
<br/>
<br/>


I’ve also worked as a software engineer, collaborated with friends to build robots and drones, and yes—I absolutely snack on chips and soda while doing all this. I was an active member of the IEEE Student Branch at KLS GIT, started a Photography Club during my undergrad, and served as the Design Head for three semesters at IIT Chicago.
<br/>
<br/>


Oh—and one more thing: I can Procreate (yes, the iPad app—designing, illustrating, and occasionally doodling nonsense that turns out kinda cool).
</p>
        </div>
      </div>
    </div>
  );
}