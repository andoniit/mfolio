"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import styles from "./SiteFooter.module.scss";
import NewsletterSubscribeForm from "./NewsletterSubscribeForm";

const EASE = [0.16, 1, 0.3, 1] as const;

const SOCIALS = [
  {
    href: "https://www.linkedin.com/in/anirudha-kapileshwari-293826202/",
    icon: "/icons/3.png",
    label: "LinkedIn",
    handle: "@anirudha",
  },
  { href: "https://github.com/andoniit", icon: "/icons/2.png", label: "GitHub", handle: "@andoniit" },
  {
    href: "https://www.behance.net/aniruddkapiles1",
    icon: "/icons/1.png",
    label: "Behance",
    handle: "@aniruddkapiles1",
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function SiteFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const inView = useInView(footerRef, { once: true, amount: 0.2 });

  return (
    <section className={styles.footerWrapper} data-site-footer="true">
      <footer ref={footerRef} className={styles.footer} role="contentinfo">
        <motion.div
          className={styles.footerTop}
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Brand + newsletter */}
          <motion.div className={styles.brandCol} variants={item}>
            <div className={styles.newsletterBlock}>
              <h3 className={styles.newsletterHeading}>Subscribe to my newsletter</h3>
              <p className={styles.newsletterSubtext}>Get blog posts and updates from me.</p>
              <NewsletterSubscribeForm />
            </div>
          </motion.div>

          {/* Explore */}
          <motion.nav className={styles.linksCol} variants={item} aria-label="Explore">
            <span className={styles.colHeading}>Explore</span>
            <Link href="/" className={styles.colLink}>Home</Link>
            <Link href="/blog" className={styles.colLink}>Blogs</Link>
            <Link href="/projects" className={styles.colLink}>Projects</Link>
            <a href="mailto:anikap1999@gmail.com" className={styles.colLink}>Contact</a>
          </motion.nav>

          {/* Follow me */}
          <motion.div className={styles.linksCol} variants={item}>
            <span className={styles.colHeading}>Follow me</span>
            <div className={styles.followPills}>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.followPill}
                >
                  <img src={s.icon} alt={s.label} />
                  <span>{s.handle}</span>
                </a>
              ))}
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div className={styles.ctaCol} variants={item}>
            <a
              href="mailto:anikap1999@gmail.com"
              className={`${styles.ctaCard} ${styles.ctaPrimary}`}
            >
              <span className={styles.ctaHead}>
                Let&apos;s chat <span className={styles.ctaArrow} aria-hidden>↗</span>
              </span>
              <span className={styles.ctaSub}>Let&apos;s work together</span>
            </a>
            <Link href="/projects" className={`${styles.ctaCard} ${styles.ctaSecondary}`}>
              <span className={styles.ctaHead}>
                View my work <span className={styles.ctaArrow} aria-hidden>↗</span>
              </span>
              <span className={styles.ctaSub}>Selected projects</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Legal row (sits just above the giant wordmark) */}
        <motion.div
          className={styles.metaRow}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <span className={styles.metaLeft}>
            © 2026 Anirudha Kapileshwari <span className={styles.metaDot}>·</span>{" "}
            <span className={styles.metaMuted}>Privacy Policy</span>
          </span>

          <a
            href="https://wdawards.com/web/anikap-tech"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.awardBadge}
            aria-label="WD Awards — Favourite Web Design winner. View the award."
          >
            <span className={styles.awardSeal} aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7 6h26a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H18l-7 6v-6H7a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"
                  stroke="var(--mf-red, #ea3e3e)"
                  strokeWidth="3"
                />
                <g transform="translate(14,10) scale(0.5)" fill="var(--mf-red, #ea3e3e)">
                  <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6z" />
                </g>
              </svg>
            </span>
            <span className={styles.awardInfo}>
              <span className={styles.awardTitle}>Favourite Web Design</span>
              <span className={styles.awardMeta}>WD Awards · 2026</span>
            </span>
          </a>
        </motion.div>

        {/* Giant brand wordmark — bleeds off the bottom edge */}
        <motion.div
          className={styles.wordmark}
          initial={{ y: 100, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : undefined}
          transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
          aria-hidden="true"
        >
          anikap.tech
        </motion.div>
      </footer>
    </section>
  );
}
