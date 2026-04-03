import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionTemplate } from "framer-motion";
import styles from "./SiteFooter.module.scss";
import NewsletterSubscribeForm from "./NewsletterSubscribeForm";

export default function SiteFooter() {
  const footerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["0 1", "1 1"], 
  });

  const andonScale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const contactScale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);

  const fillPercentage = useTransform(scrollYProgress, [0.3, 0.9], [0, 100]);
  const textFillGradient = useMotionTemplate`linear-gradient(to bottom, #ffffff ${fillPercentage}%, #000000 ${fillPercentage}%)`;

  // Staggered scales for the Nav Pills so they pop up one by one
  const pill1Scale = useTransform(scrollYProgress, [0.1, 0.5], [0.6, 1]);
  const pill2Scale = useTransform(scrollYProgress, [0.2, 0.6], [0.6, 1]);
  const pill3Scale = useTransform(scrollYProgress, [0.3, 0.7], [0.6, 1]);
  const pill4Scale = useTransform(scrollYProgress, [0.4, 0.8], [0.6, 1]);

  return (
    <footer ref={footerRef} className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        
        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>
          <div className={styles.newsletterSection}>
            <h2 className={styles.newsletterHeading}>Subscribe to my newsletter</h2>
            <p className={styles.newsletterSubtext}>
              Get blog posts and updates from me.
            </p>
            <NewsletterSubscribeForm />
          </div>

          <div className={styles.bottomLeftGroup}>
            {/* Animated ANDON Arrow Box */}
            <motion.div 
              className={styles.arrowBox}
              style={{ scale: andonScale, transformOrigin: "left center" }}
            >
              <motion.span 
                className={styles.arrowText}
                style={{ backgroundImage: textFillGradient }}
              >
                ANDON
              </motion.span>
            </motion.div>
            
            {/* Fixed height container ensures horizontal alignment with right column */}
            <div className={styles.footerBottomLeft}>
              <p className={styles.copyrightText}>
                © 2026 Anirudha Kapileshwari. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>
          
          <div className={styles.bottomRightGroup}>
            
            {/* Animated Nav Pills */}
            {/* <div className={styles.navPills}>
              <motion.div style={{ scale: pill1Scale }} className={styles.navPillWrapper}>
                <Link href="/" className={styles.navPill}>Home</Link>
              </motion.div>
              <motion.div style={{ scale: pill2Scale }} className={styles.navPillWrapper}>
                <Link href="/blogs" className={styles.navPill}>Blogs</Link>
              </motion.div>
              <motion.div style={{ scale: pill3Scale }} className={styles.navPillWrapper}>
                <Link href="/projects" className={styles.navPill}>Projects</Link>
              </motion.div>
              <motion.div style={{ scale: pill4Scale }} className={styles.navPillWrapper}>
                <Link href="/contact" className={styles.navPill}>Contact</Link>
              </motion.div>
            </div> */}

            {/* Animated Contact Box with Glassmorphism */}
            <motion.div 
              className={styles.contactWrapper}
              style={{ scale: contactScale, transformOrigin: "right center" }}
            >
              <a href="mailto:anikap1999@gmail.com" className={styles.contactButton}>
                <span className={styles.contactLabel}>Lets get connected</span>
                <span className={styles.contactEmail}>anikap1999@gmail.com</span>
              </a>
            </motion.div>

            {/* Fixed height container matching the left side */}
            <div className={styles.footerBottomRight}>
              <div className={styles.socialIcons}>
                <a 
                  href="https://www.linkedin.com/in/anirudha-kapileshwari-293826202/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.socialBtn}
                >
                  <img src="/3.png" alt="LinkedIn" className={styles.socialIconImg} />
                </a>
                <a 
                  href="https://github.com/andoniit" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.socialBtn}
                >
                  <img src="/2.png" alt="GitHub" className={styles.socialIconImg} />
                </a>
                <a 
                  href="https://www.behance.net/aniruddkapiles1" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.socialBtn}
                >
                  <img src="/1.png" alt="Behance" className={styles.socialIconImg} />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}