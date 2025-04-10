"use client";
import { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import Image from 'next/image';
import styles from './SliderSection.module.scss';

const slider1 = [
  { color: "#e3e5e7", src: "15.JPG" },
  { color: "#d6d7dc", src: "18.jpg" },
  { color: "#e3e3e3", src: "17.jpg" },
  { color: "#21242b", src: "19.jpg" }
];

const slider2 = [
  { color: "#d4e3ec", src: "21.jpg" },
  { color: "#e5e0e1", src: "16.JPG" },
  { color: "#d7d4cf", src: "20.jpg" },
  { color: "#e1dad6", src: "22.jpg" }
];

export default function SliderSection() {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"]
  });
  
  // Create horizontal transform values for each slider based on scroll progress
  const x1 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const x2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  
  return (
    <div ref={container} className={styles.slidingImages}>
      <motion.div style={{ x: x1 }} className={styles.slider}>
        {slider1.map((project, index) => (
          <div key={index} className={styles.project} style={{ backgroundColor: project.color }}>
            <div className={styles.imageContainer}>
              <Image 
                fill
                alt="image"
                src={`/images/${project.src}`} />
            </div>
          </div>
        ))}
      </motion.div>
      
      <motion.div style={{ x: x2 }} className={styles.slider}>
        {slider2.map((project, index) => (
          <div key={index} className={styles.project} style={{ backgroundColor: project.color }}>
            <div className={styles.imageContainer}>
              <Image 
                fill
                alt="image"
                src={`/images/${project.src}`} />
            </div>
          </div>
        ))}
      </motion.div>
      
      <div className={styles.circleContainer}>
        <div className={styles.circle}></div>
      </div>
    </div>
  );
}