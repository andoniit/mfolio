"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import styles from "./SiteFooter.module.scss";
import NewsletterSubscribeForm from "./NewsletterSubscribeForm";

const WORDMARK = "anikap.tech";
// Letters reveal across this slice of the wordmark's on-screen progress.
const LB_START = 0.2;
const LB_WINDOW = 0.12;
const LB_STEP = 0.028;

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

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Fades + rises a block as `progress` sweeps `[start, end]`. Reverses on the
 *  way back up. */
function Reveal({
  progress,
  start,
  end,
  y = 30,
  className,
  role,
  label,
  children,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  y?: number;
  className?: string;
  role?: string;
  label?: string;
  children: ReactNode;
}) {
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const ty = useTransform(progress, [start, end], [y, 0]);
  return (
    <motion.div className={className} style={{ opacity, y: ty }} role={role} aria-label={label}>
      {children}
    </motion.div>
  );
}

/** A single wordmark letter, revealed/hidden by the wordmark's scroll progress. */
function Letter({
  ch,
  progress,
  start,
  end,
}: {
  ch: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}) {
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], ["65%", "0%"]);
  return (
    <motion.span className={styles.wordmarkLetter} style={{ opacity, y }} aria-hidden="true">
      {ch}
    </motion.span>
  );
}

export default function SiteFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  // Manual progress values driven by a rAF loop reading each element's position.
  // Robust against smooth-scroll libs that break scroll events / IntersectionObserver.
  const footerProgress = useMotionValue(0);
  const wordProgress = useMotionValue(0);

  useEffect(() => {
    const measure = () => {
      const vh = window.innerHeight || 1;
      const f = footerRef.current;
      if (f) {
        const r = f.getBoundingClientRect();
        if (r.height) footerProgress.set(clamp01((vh - r.top) / r.height));
      }
      const w = wordRef.current;
      if (w) {
        const r = w.getBoundingClientRect();
        // 0 when the wordmark's top is at the viewport bottom, ~1 as it rises up.
        wordProgress.set(clamp01((vh - r.top) / (vh * 0.85)));
      }
    };
    let raf = 0;
    const loop = () => {
      measure();
      raf = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [footerProgress, wordProgress]);

  const letters = WORDMARK.split("");

  return (
    <section className={styles.footerWrapper} data-site-footer="true">
      <footer ref={footerRef} className={styles.footer} role="contentinfo">
        <div className={styles.footerTop}>
          {/* Brand + newsletter */}
          <Reveal progress={footerProgress} start={0} end={0.14} className={styles.brandCol}>
            <div className={styles.newsletterBlock}>
              <h3 className={styles.newsletterHeading}>Subscribe to my newsletter</h3>
              <p className={styles.newsletterSubtext}>Get blog posts and updates from me.</p>
              <NewsletterSubscribeForm />
            </div>
          </Reveal>

          {/* Explore */}
          <Reveal
            progress={footerProgress}
            start={0.03}
            end={0.17}
            className={styles.linksCol}
            role="navigation"
            label="Explore"
          >
            <span className={styles.colHeading}>Explore</span>
            <Link href="/" className={styles.colLink}>Home</Link>
            <Link href="/blog" className={styles.colLink}>Blogs</Link>
            <Link href="/projects" className={styles.colLink}>Projects</Link>
            <a href="mailto:anikap1999@gmail.com" className={styles.colLink}>Contact</a>
          </Reveal>

          {/* Follow me */}
          <Reveal progress={footerProgress} start={0.06} end={0.2} className={styles.linksCol}>
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
          </Reveal>

          {/* CTAs */}
          <Reveal progress={footerProgress} start={0.09} end={0.23} className={styles.ctaCol}>
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
          </Reveal>
        </div>

        {/* Award badge (sits just above the giant wordmark) */}
        <Reveal progress={footerProgress} start={0.16} end={0.3} y={24} className={styles.metaRow}>
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
        </Reveal>

        {/* Giant wordmark — letters reveal L→R as it scrolls up, hide R→L on scroll up */}
        <div ref={wordRef} className={styles.wordmark} aria-label={WORDMARK}>
          {letters.map((ch, i) => {
            const start = LB_START + i * LB_STEP;
            return (
              <Letter key={i} ch={ch} progress={wordProgress} start={start} end={start + LB_WINDOW} />
            );
          })}
        </div>

        {/* Copyright — bottom-left, below the wordmark */}
        <Reveal progress={wordProgress} start={0.6} end={0.8} y={16} className={styles.copyrightLine}>
          © 2026 Anirudha Kapileshwari <span className={styles.metaDot}>·</span>{" "}
          <span className={styles.metaMuted}>Privacy Policy</span>
        </Reveal>
      </footer>
    </section>
  );
}
