"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Header.module.scss";
import { supabase } from "@/lib/supabase";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.2 },
  },
};

const navVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const linkVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

// 🌟 Interactive Contact Button with Roll-out Circles & Proximity Eyes
const InteractiveContactButton = () => {
  const eyeLeftRef = useRef(null);
  const eyeRightRef = useRef(null);
  const pupilLeftRef = useRef(null);
  const pupilRightRef = useRef(null);
  const buttonRef = useRef(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isNear, setIsNear] = useState(false);

  // Eye tracking & Proximity logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        setIsNear(dist < 300);
      }

      const updateEye = (eyeRef, pupilRef) => {
        if (!eyeRef.current || !pupilRef.current) return;
        const eye = eyeRef.current.getBoundingClientRect();
        if (eye.width === 0) return;

        const eyeCenterX = eye.left + eye.width / 2;
        const eyeCenterY = eye.top + eye.height / 2;
        const deltaX = e.clientX - eyeCenterX;
        const deltaY = e.clientY - eyeCenterY;
        const angle = Math.atan2(deltaY, deltaX);

        const maxRadius = eye.width / 2 - pupilRef.current.offsetWidth / 2 - 1.5;
        const distance = Math.min(maxRadius, Math.hypot(deltaX, deltaY) / 12);

        const pupilX = distance * Math.cos(angle);
        const pupilY = distance * Math.sin(angle);

        pupilRef.current.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
      };

      updateEye(eyeLeftRef, pupilLeftRef);
      updateEye(eyeRightRef, pupilRightRef);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const circleVariants = {
    rest: { rotate: -270, opacity: 0 },
    hover: { rotate: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div
      className={styles.contactWrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial="rest"
      animate={isHovered ? "hover" : "rest"}
    >
      <motion.div
        className={styles.socialCircles}
        variants={{
          rest: { width: 0, opacity: 0, marginRight: 0 },
          hover: { width: "auto", opacity: 1, marginRight: 12 },
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.a 
          variants={circleVariants}
          href="https://www.linkedin.com/in/anirudha-kapileshwari-293826202/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.socialCircle}
        >
          <img src="/3.png" alt="LinkedIn" className={styles.socialIcon} />
        </motion.a>
        <motion.a 
          variants={circleVariants}
          href="https://github.com/andoniit" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.socialCircle}
        >
          <img src="/2.png" alt="GitHub" className={styles.socialIcon} />
        </motion.a>
        <motion.a 
          variants={circleVariants}
          href="https://www.behance.net/aniruddkapiles1" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.socialCircle}
        >
          <img src="/1.png" alt="Behance" className={styles.socialIcon} />
        </motion.a>
      </motion.div>

      <a 
        ref={buttonRef} 
        href="mailto:anikap1999@gmail.com" 
        className={styles.contactButton}
      >
        <span className={styles.contactText}>Get in touch</span>
        
        <motion.div 
          className={styles.eyesWrapper}
          initial={{ width: 0, scale: 0, opacity: 0, marginLeft: 0 }}
          animate={isNear ? { width: "auto", scale: 1, opacity: 1, marginLeft: 8 } : { width: 0, scale: 0, opacity: 0, marginLeft: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div ref={eyeLeftRef} className={styles.eye}>
            <div ref={pupilLeftRef} className={styles.pupil} />
          </div>
          <div ref={eyeRightRef} className={styles.eye}>
            <div ref={pupilRightRef} className={styles.pupil} />
          </div>
        </motion.div>
      </a>
    </motion.div>
  );
};

// 🌟 Smooth Framer-Motion Hamburger Icon
const HamburgerIcon = ({ isOpen }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.path
      stroke="#ededed"
      strokeWidth="2"
      strokeLinecap="round"
      animate={isOpen ? { d: "M 6 18 L 18 6" } : { d: "M 4 8 L 20 8" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    />
    <motion.path
      stroke="#ededed"
      strokeWidth="2"
      strokeLinecap="round"
      animate={isOpen ? { d: "M 6 6 L 18 18" } : { d: "M 4 16 L 20 16" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    />
  </svg>
);

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setIsAdminLoggedIn(!!data.session);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsAdminLoggedIn(!!session);
    });
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
    return () => { cancelled = true; };
  }, []);

  // Shared Nav Items Component to render inside Desktop and Mobile views
  const NavItems = ({ isMobile }) => (
    <>
      <motion.div variants={linkVariants} className={isMobile ? styles.mobileNavItem : ""}>
        <InteractiveContactButton />
      </motion.div>

      {resumeUrl && (
        <motion.div className={`${styles.resumeWrapper} ${isMobile ? styles.mobileNavItem : ""}`} variants={linkVariants}>
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.resumeButtonPill}
          >
            <span className={styles.buttonContent}>View My Resume</span>
          </a>
          {/* Only show tooltip on desktop */}
          {!isMobile && (
            <div className={styles.resumeTooltip}>
              <div className={styles.iframeWrapper}>
                <iframe 
                  src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                  className={styles.resumePreview}
                  title="Resume Preview"
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {isAdminLoggedIn && (
        <motion.div variants={linkVariants} className={isMobile ? styles.mobileNavItem : ""}>
          <Link href="/admin" className={styles.dashboardButtonPill}>
            Dashboard
          </Link>
        </motion.div>
      )}
    </>
  );

  return (
    <motion.header className={styles.header} variants={containerVariants}>
      <div className={styles.container}>
        
        {/* Logo */}
        <Link href="/" className={styles.logoLink}>
          <motion.div className={isScrolled ? `${styles.title} ${styles.titleSmall}` : styles.title}>
            <h1>Andon</h1>
            <p>Anirudha Kapileshwari</p>
          </motion.div>
        </Link>
        
        {/* Desktop Navigation */}
        <motion.nav className={styles.desktopNav} variants={navVariants}>
          <NavItems isMobile={false} />
        </motion.nav>

        {/* Mobile Hamburger Toggle Button */}
        <button 
          className={styles.mobileToggleBtn}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <HamburgerIcon isOpen={isMobileMenuOpen} />
        </button>
      </div>

      {/* 📱 Mobile Sliding Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className={styles.mobileDropdown}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className={styles.mobileDropdownContent}>
              <NavItems isMobile={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}