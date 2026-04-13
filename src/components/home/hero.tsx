"use client";

import styles from './Hero.module.scss';
import Image from 'next/image';
import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Picture4 from '../../../public/images/23.jpg';
import Picture2 from '../../../public/images/2.jpg';
import Picture1 from '../../../public/images/1.jpg';
import Picture3 from '../../../public/images/4.jpg';
import Picture5 from '../../../public/images/25.jpg';
import Picture7 from '../../../public/images/7.jpg';
import AnimatedIntroText from './AnimatedIntroText';


export default function Hero() {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end']
  });

  // Landing overlay transforms
  const opacityLanding = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const yLanding = useTransform(scrollYProgress, [0, 0.05], [0, -50]);
  const scaleLanding = useTransform(scrollYProgress, [0, 0.05], [1, 0.95]);

  // Scale transforms for each section.
  const scaleSection1 = useTransform(scrollYProgress, [0, 1], [1, 4.2]);
  const scaleSection2 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scaleSection3 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scaleSection4 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scaleSection5 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scaleSection6 = useTransform(scrollYProgress, [0, 1], [1, 8]);
  const scaleSection7 = useTransform(scrollYProgress, [0, 1], [1, 9]);

  // Opacity for other images to appear on scroll
  const opacityOthers = useTransform(scrollYProgress, [0.02, 0.08], [0, 1]);

 // Seattle local time (without seconds)
const [seattleTime, setSeattleTime] = useState("");

useEffect(() => {
  const interval = setInterval(() => {
    const time = new Date().toLocaleTimeString("en-US", {
      timeZone: "America/Los_Angeles", // ✅ Seattle = Pacific Time
      hour: "numeric",
      minute: "numeric",
    });
    setSeattleTime(time);
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
    <div id="hero-section" ref={container} className={styles.container}>
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
              alt="Portrait-style hero visual for Anirudha Kapileshwari portfolio"
              placeholder="blur"
            />
          </div>
        </motion.div>

        {/* Landing Overlay - fades out on scroll */}
        <motion.div
          style={{ opacity: opacityLanding, y: yLanding, scale: scaleLanding }}
          className={styles.landingOverlay}
        >
          <div className={styles.welcomeTextContainer}>
            <h1 className={`${styles.welcomeLine} ${styles.top}`}>
              <AnimatedIntroText startAnimation={preloaderFinished}><span>Welcome,</span></AnimatedIntroText>
            </h1>
            <p className={`${styles.welcomeLine} ${styles.bottom}`}>
              <AnimatedIntroText startAnimation={preloaderFinished}><span>Hello There</span></AnimatedIntroText>
            </p>
          </div>
          
          <motion.div 
            className={styles.purpleStar}
            initial={{ opacity: 0, x: 100, rotate: 90 }}
            animate={preloaderFinished ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: 100, rotate: 90 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <Image src="/star.png" alt="Star graphic" fill style={{ objectFit: 'contain' }} />
          </motion.div>

          <div className={styles.bottomLeftInfo}>
            <AnimatedIntroText startAnimation={preloaderFinished}>
              <span>USA Based</span>
            </AnimatedIntroText>
            <AnimatedIntroText startAnimation={preloaderFinished}>
              <span>Software Developer</span>
            </AnimatedIntroText>
          </div>

          <div className={styles.bottomRightInfo}>
            <AnimatedIntroText startAnimation={preloaderFinished}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.greenDot}></div>
                <span className={styles.blendingText}>Open to work</span>
              </div>
            </AnimatedIntroText>
          </div>
        </motion.div>

        {/* Section 2: Text */}
        <motion.div style={{ scale: scaleSection2, opacity: opacityOthers }} className={`${styles.el} ${styles.section2}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              I am a Developer
            </div>
            <Image
              src={Picture2}
              fill
              alt="Developer workspace visual"
              placeholder="blur"
            />
          </div>
        </motion.div>

        {/* Section 3: Text */}
        <motion.div style={{ scale: scaleSection3, opacity: opacityOthers }} className={`${styles.el} ${styles.section3}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              United States
            </div>
            <Image
              src={Picture1}
              fill
              alt="United States themed visual"
              placeholder="blur"
            />
          </div>
        </motion.div>

        {/* Section 4: Text with Chicago Local Time */}
        <motion.div style={{ scale: scaleSection4, opacity: opacityOthers }} className={`${styles.el} ${styles.section4}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              I am from <span className={styles.highlight}>Seattle, WA</span>
              <br />
              {seattleTime}
            </div>
          </div>
        </motion.div>
        
        {/* Section 5: Text */}
        <motion.div style={{ scale: scaleSection5, opacity: opacityOthers }} className={`${styles.el} ${styles.section5}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              I am from Chicago
            </div>
            <Image
              src={Picture5}
              fill
              alt="Chicago city-themed visual"
              placeholder="blur"
            />
          </div>
        </motion.div>

        {/* Section 6: Text */}
        <motion.div style={{ scale: scaleSection6, opacity: opacityOthers }} className={`${styles.el} ${styles.section6}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              I study at IIT
            </div>
            <Image
              src={Picture3}
              fill
              alt="IIT campus-inspired visual"
              placeholder="blur"
            />
          </div>
        </motion.div>

        {/* Section 7: Text */}
        <motion.div style={{ scale: scaleSection7, opacity: opacityOthers }} className={`${styles.el} ${styles.section7}`}>
          <div className={styles.imageContainer}>
            <div className={styles.textContent}>
              I am a Developer
            </div>
            <Image
              src={Picture7}
              fill
              alt="Software development themed visual"
              placeholder="blur"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}