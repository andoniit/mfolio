"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./Preloader.module.scss";

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

  // Black curve variant (moves first)
  const curve = {
    initial: {
      d: initialPath,
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      d: targetPath,
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] ,delay: 0.4 }, // no delay here
    },
  };

  // Orange curve variant (moves after black curve)
  const curve2 = {
    initial: {
      d: initialPath,
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.2 },
    },
    exit: {
      d: targetPath,
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.45 },
    },
  };

  return (
    <motion.div variants={slideUp} initial="initial" exit="exit" className={styles.introduction}>
      {dimensions.width > 0 && (
        <>
          <motion.p variants={opacity} initial="initial" animate="enter">
            {words[index]}
          </motion.p>
          {/* Render the orange curve first (behind) */}
          <svg style={{ position: "absolute", zIndex: 1 }}>
            <motion.path
              variants={curve2}
              initial="initial"
              exit="exit"
              style={{ fill: "#ff3636" }}
            />
          </svg>
          {/* Then render the black curve on top */}
          <svg style={{ position: "absolute", zIndex: 2 }}>
            <motion.path variants={curve} initial="initial" exit="exit" />
          </svg>
        </>
      )}
    </motion.div>
  );
}