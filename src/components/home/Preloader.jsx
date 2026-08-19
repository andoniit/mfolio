"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./Preloader.module.scss";
import { PRELOADER_DURATION_MS } from "@/constants/preloader-logo";

// Home-page logo intro timing is aligned via LOGO_INTRO_DELAY_SEC in @/constants/preloader-logo

import Picture4 from "../../../public/images/23.jpg";
import Picture2 from "../../../public/images/2.jpg";
import Picture1 from "../../../public/images/1.jpg";
import Picture3 from "../../../public/images/4.jpg";
import Picture5 from "../../../public/images/25.jpg";
import Picture7 from "../../../public/images/7.jpg";

/**
 * The hero's own photos, rolled in a loop inside a frame that matches
 * `.section1 .imageContainer` in Hero.module.scss (25vw x 25vh, 20px radius),
 * so the curtain lifts onto the image already sitting in that spot.
 * `Picture4` is the hero's centre image, so the roll starts and ends on it.
 */
const rollImages = [Picture4, Picture2, Picture1, Picture3, Picture5, Picture7];

const ROLL_INTERVAL_MS = 520;

const loaderFadeTransition = { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 };

export const slideUp = {
  initial: { top: 0 },
  exit: { top: "-100vh", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 } },
};

/* One sliding strip rather than an AnimatePresence per frame: the counter
   re-renders every rAF, and swapping presence children that fast left the
   outgoing slides stacked under the frame instead of rolling through it. */
const rollTransition = { duration: 0.5, ease: [0.76, 0, 0.24, 1] };

export default function Preloader() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  // `pos` walks 0 → rollImages.length; the strip carries a copy of the first
  // photo at the end, so the wrap back to 0 is an instant, invisible snap.
  const [pos, setPos] = useState(0);
  const [snap, setSnap] = useState(false);
  // Where the hero's centre photo actually sits — its sticky box starts below
  // the header, so it is not the viewport centre. Null while unmeasured (or if
  // the hero is absent), in which case the loader falls back to centred.
  const [heroFrame, setHeroFrame] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  // Photo roll — loops for as long as the curtain is up.
  useEffect(() => {
    const id = setInterval(() => {
      setSnap(false);
      setPos((p) => p + 1);
    }, ROLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Counter (eased so it sprints then settles onto 100) plus a running measure
  // of the hero frame. Measuring once on mount was not enough: the header
  // finishes laying out afterwards and drags the hero down ~25px, which showed
  // up as a jump the moment the curtain lifted. The loop runs past 100% so the
  // rect stays true through the exit animation too.
  useEffect(() => {
    let raf;
    let rect = null;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min((now - start) / PRELOADER_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - t, 1.8);
      setProgress(Math.round(eased * 100));

      const el = document.querySelector("[data-hero-frame]");
      if (el) {
        const r = el.getBoundingClientRect();
        const moved =
          !rect ||
          Math.abs(rect.top - r.top) > 0.5 ||
          Math.abs(rect.left - r.left) > 0.5 ||
          Math.abs(rect.width - r.width) > 0.5 ||
          Math.abs(rect.height - r.height) > 0.5;
        if (moved) {
          rect = { top: r.top, left: r.left, width: r.width, height: r.height };
          setHeroFrame(rect);
        }
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const initialPath = `M0 0 L${dimensions.width} 0 L${dimensions.width} ${dimensions.height} Q${dimensions.width / 2} ${dimensions.height + 300} 0 ${dimensions.height} L0 0`;
  const targetPath = `M0 0 L${dimensions.width} 0 L${dimensions.width} ${dimensions.height} Q${dimensions.width / 2} ${dimensions.height} 0 ${dimensions.height} L0 0`;

  const ease = [0.76, 0, 0.24, 1];
  const dur = 0.7;

  // Back → front on enter; top (black) peels first on exit, then red → purple → lime
  const curveLime = {
    initial: {
      d: initialPath,
      transition: { duration: dur, ease, delay: 0 },
    },
    exit: {
      d: targetPath,
      transition: { duration: dur, ease, delay: 0.52 },
    },
  };

  const curvePurple = {
    initial: {
      d: initialPath,
      transition: { duration: dur, ease, delay: 0.08 },
    },
    exit: {
      d: targetPath,
      transition: { duration: dur, ease, delay: 0.48 },
    },
  };

  const curveRed = {
    initial: {
      d: initialPath,
      transition: { duration: dur, ease, delay: 0.16 },
    },
    exit: {
      d: targetPath,
      transition: { duration: dur, ease, delay: 0.44 },
    },
  };

  const curveBlack = {
    initial: {
      d: initialPath,
      transition: { duration: dur, ease, delay: 0.24 },
    },
    exit: {
      d: targetPath,
      transition: { duration: dur, ease, delay: 0.38 },
    },
  };

  return (
    <motion.div variants={slideUp} initial="initial" exit="exit" className={styles.introduction}>
      {dimensions.width > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={loaderFadeTransition}
            className={styles.loader}
            style={
              heroFrame
                ? {
                    position: "absolute",
                    top: heroFrame.top,
                    left: heroFrame.left,
                    width: heroFrame.width,
                    height: heroFrame.height,
                  }
                : undefined
            }
            role="status"
            aria-live="polite"
            aria-label={`Loading, ${progress} percent`}
          >
            <div className={styles.meter}>
              <span className={styles.counter}>{progress}%</span>
              <div className={styles.track}>
                <div className={styles.bar} style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className={styles.frame}>
              <motion.div
                className={styles.strip}
                animate={{ y: `-${pos * 100}%` }}
                transition={snap ? { duration: 0 } : rollTransition}
                onAnimationComplete={() => {
                  if (pos === rollImages.length) {
                    setSnap(true);
                    setPos(0);
                  }
                }}
              >
                {[...rollImages, rollImages[0]].map((img, i) => (
                  <div key={i} className={styles.slide} style={{ top: `${i * 100}%` }}>
                    <Image
                      src={img}
                      alt=""
                      fill
                      priority
                      sizes="25vw"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Layered color curves (back → front); black mask on top */}
          <svg style={{ position: "absolute", zIndex: 1 }}>
            <motion.path
              variants={curveLime}
              initial="initial"
              exit="exit"
              style={{ fill: "var(--mf-lime)" }}
            />
          </svg>
          <svg style={{ position: "absolute", zIndex: 2 }}>
            <motion.path
              variants={curvePurple}
              initial="initial"
              exit="exit"
              style={{ fill: "var(--mf-purple)" }}
            />
          </svg>
          <svg style={{ position: "absolute", zIndex: 3 }}>
            <motion.path
              variants={curveRed}
              initial="initial"
              exit="exit"
              style={{ fill: "var(--mf-red)" }}
            />
          </svg>
          <svg style={{ position: "absolute", zIndex: 4 }}>
            <motion.path variants={curveBlack} initial="initial" exit="exit" />
          </svg>
        </>
      )}
    </motion.div>
  );
}
