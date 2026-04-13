"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./Preloader.module.scss";

// Home-page logo intro timing is aligned via LOGO_INTRO_DELAY_SEC in @/constants/preloader-logo

const words = ["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"];

export const opacity = {
  initial: { opacity: 0 },
  enter: { opacity: 0.75, transition: { duration: 1, delay: 0.2 } },
};

export const slideUp = {
  initial: { top: 0 },
  exit: { top: "-100vh", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 } },
};

export default function Preloader() {
  const [index, setIndex] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    if (index === words.length - 1) return;
    const timeout = setTimeout(() => {
      setIndex(index + 1);
    }, index === 0 ? 1000 : 150);
    return () => clearTimeout(timeout);
  }, [index]);

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
          <motion.p variants={opacity} initial="initial" animate="enter">
            {words[index]}
          </motion.p>
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