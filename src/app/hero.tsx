"use client";

import styles from './Hero.module.scss';
import Image from 'next/image';
import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Picture4 from '../../public/images/4.jpg';
import Picture1 from '../../public/images/1.jpg';
import Picture2 from '../../public/images/2.jpg';
import Picture3 from '../../public/images/3.jpg';
import Picture5 from '../../public/images/5.jpg';
import Picture7 from '../../public/images/7.jpg';


export default function Hero() {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end']
  });

  // Scale transforms for each section.
  const scaleSection1 = useTransform(scrollYProgress, [0, 1], [1, 4.2]);
  const scaleSection2 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scaleSection3 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scaleSection4 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scaleSection5 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scaleSection6 = useTransform(scrollYProgress, [0, 1], [1, 8]);
  const scaleSection7 = useTransform(scrollYProgress, [0, 1], [1, 9]);

  // Chicago local time (without seconds)
  const [chicagoTime, setChicagoTime] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString("en-US", { 
        timeZone: "America/Chicago", 
        hour: "numeric", 
        minute: "numeric"
      });
      setChicagoTime(time);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Intro animation variants for each section.
  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  };

  // Container variant to stagger children.
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  // This state controls when the hero animation should start.
  const [preloaderFinished, setPreloaderFinished] = useState(false);

  useEffect(() => {
    // For example, wait 3 seconds before starting the hero intro animation.
    const timer = setTimeout(() => {
      setPreloaderFinished(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={container} className={styles.container}>
      <motion.div
        className={styles.sticky}
        initial="hidden"
        animate={preloaderFinished ? "visible" : "hidden"}
        variants={containerVariants}
      >
        {/* Section 1: Center Image */}
        <motion.div variants={itemVariants} style={{ scale: scaleSection1 }} className={`${styles.el} ${styles.section1}`}>
          <div className={styles.imageContainer}>
            <Image
              src={Picture4}
              fill
              alt="Center Hero Image"
              placeholder="blur"
            />
          </div>
        </motion.div>

        {/* Section 2: Text */}
        <motion.div variants={itemVariants} style={{ scale: scaleSection2 }} className={`${styles.el} ${styles.section2}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              I am a Developer
            </div>
            <Image
              src={Picture2}
              fill
              alt="Developer"
              placeholder="blur"
            />
          </div>
        </motion.div>

        {/* Section 3: Text */}
        <motion.div variants={itemVariants} style={{ scale: scaleSection3 }} className={`${styles.el} ${styles.section3}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              United States
            </div>
            <Image
              src={Picture1}
              fill
              alt="United States"
              placeholder="blur"
            />
          </div>
        </motion.div>

        {/* Section 4: Text with Chicago Local Time */}
        <motion.div variants={itemVariants} style={{ scale: scaleSection4 }} className={`${styles.el} ${styles.section4}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              I am from <span className={styles.highlight}>Chicago</span>
              <br />
              {chicagoTime}
            </div>
          </div>
        </motion.div>
        
        {/* Section 5: Text */}
        <motion.div variants={itemVariants} style={{ scale: scaleSection5 }} className={`${styles.el} ${styles.section5}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              I am from Chicago
            </div>
            <Image
              src={Picture5}
              fill
              alt="Chicago"
              placeholder="blur"
            />
          </div>
        </motion.div>

        {/* Section 6: Text */}
        <motion.div variants={itemVariants} style={{ scale: scaleSection6 }} className={`${styles.el} ${styles.section6}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              I study at IIT
            </div>
            <Image
              src={Picture3}
              fill
              alt="IIT"
              placeholder="blur"
            />
          </div>
        </motion.div>

        {/* Section 7: Text */}
        <motion.div variants={itemVariants} style={{ scale: scaleSection7 }} className={`${styles.el} ${styles.section7}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              I am a Developer
            </div>
            <Image
              src={Picture7}
              fill
              alt="Developer"
              placeholder="blur"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}