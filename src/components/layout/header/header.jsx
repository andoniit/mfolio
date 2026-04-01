"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./Header.module.scss";
import Framer from "@/components/shared/Framer";
import { supabase } from "@/lib/supabase";



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
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);

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

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setIsAdminLoggedIn(!!data.session);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setIsAdminLoggedIn(!!session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/resume");
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && typeof data.url === "string" && data.url) {
          setResumeUrl(data.url);
        }
      } catch {
        if (!cancelled) setResumeUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.header
      className={styles.header}
      variants={containerVariants}
      //initial="hidden"
      //animate={preloaderFinished ? "visible" : "hidden"}
    >
      <div className={styles.container}>
        
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
        
        <motion.nav className={styles.nav} variants={navVariants}>
        
        <Framer>
          <motion.a
            href="https://www.linkedin.com/in/anirudha-kapileshwari-293826202/"
            variants={linkVariants}
            target="_blank"
          >
            <img
              className={styles.icon}
              src="/3.png"
              alt="LinkedIn Icon"
            />
            Linkedin
          </motion.a>
        </Framer>
        <Framer>

          <motion.a href="https://github.com/andoniit" target="_blank" variants={linkVariants}>
            <img
              className={styles.icon}
              src="/2.png"
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
        {resumeUrl && (
          <Framer>
            <motion.a
              href={resumeUrl}
              variants={linkVariants}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.resumeButton}
            >
              View My Resume
            </motion.a>
          </Framer>
        )}

        {isAdminLoggedIn && (
          <Framer>
            <Link href="/admin/blogs" className={styles.dashboardButton}>
              Dashboard
            </Link>
          </Framer>
        )}

        </motion.nav>
      </div>
    </motion.header>
  );
}