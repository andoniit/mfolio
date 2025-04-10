"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./Header.module.scss";
import Framer from "@/components/Framer";



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.2 },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const navVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const linkVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  // Delay header animation until preloader is finished
  const [preloaderFinished, setPreloaderFinished] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Simulate preloader finish after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreloaderFinished(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.header
      className={styles.header}
      variants={containerVariants}
      //initial="hidden"
      //animate={preloaderFinished ? "visible" : "hidden"}
    >
      <div className={styles.container}>
        <Framer>
          <motion.div
            className={
              isScrolled
                ? `${styles.title} ${styles.titleSmall}`
                : styles.title
            }
            
          >
            <h1>Andon</h1>
            <p>Anirudha Kapileshwari</p>
          </motion.div>
        </Framer>
        <motion.nav className={styles.nav} variants={navVariants}>
        
        <Framer>
          <motion.a
            href="https://www.linkedin.com/in/anirudha-kapileshwari-293826202/"
            variants={linkVariants}
            target="_blank"
          >
            <img
              className={styles.icon}
              src="/2.png"
              alt="LinkedIn Icon"
            />
            Linkedin
          </motion.a>
        </Framer>
        <Framer>

          <motion.a href="https://github.com/andoniit" target="_blank" variants={linkVariants}>
            <img
              className={styles.icon}
              src="/3.png"
              alt="GitHub Icon"
            />
            GitHub
          </motion.a>
        </Framer>
        <Framer>

          <motion.a
            href="https://www.behance.net/aniruddkapiles1"
            variants={linkVariants}
            target="_blank"
          >
            <img
              className={styles.icon}
              src="/1.png"
              alt="Behance Icon"
            />
            Behance
          </motion.a>
        </Framer>

        </motion.nav>
      </div>
    </motion.header>
  );
}