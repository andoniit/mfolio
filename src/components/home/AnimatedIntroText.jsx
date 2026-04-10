"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function AnimatedIntroText({ children, text = "", className = "", startAnimation = true }) {
  const ref = useRef(null);
  // Trigger animation when the element is somewhat in view
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  // Use 'text' prop if provided, otherwise check 'children'.
  // If children is a simple string, split by newline to get lines.
  const rawText = text || (typeof children === "string" ? children : "");
  
  // Handle both multiline strings (separated by \n) or an array of strings
  // If it's a single long string without newlines, it will just be one element, so we can split it by words if preferred
  const lines = Array.isArray(rawText) 
    ? rawText 
    : typeof rawText === "string" 
      // If it's a long continuous string without newlines, split it by words so it staggers words instead of the whole block at once
      ? rawText.includes('\n') ? rawText.split('\n') : rawText.split(' ')
      : [rawText];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.07, // stagger the lines exactly like the code (0.07)
      },
    },
  };

  const lineVariants = {
    hidden: { 
      y: "100%",
      rotateX: -105,
      skewY: -2,
      scale: 0.8,
      opacity: 0,
      color: "#dddddd" // starts grey (like linerevealv2)
    },
    visible: { 
      y: "0%",
      rotateX: 0,
      skewY: 0,
      scale: 1,
      opacity: 1,
      // Color transition: grey -> lime -> purple -> black
      color: ["#dddddd", "#a3e635", "#8b5cf6", "#111111"], 
      transition: {
        // "power4.out" equivalent cubic-bezier
        y: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
        rotateX: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
        skewY: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
        // Color transition
        color: { duration: 1.2, ease: "easeInOut", times: [0, 0.4, 0.7, 1] }
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView && startAnimation ? "visible" : "hidden"}
    >
      {/* If children is not just a string and no text prop is passed, render children wrapped in animation */}
      {!text && typeof children !== "string" ? (
        <span style={{ display: "inline-block", overflow: "hidden", paddingBottom: "4px", perspective: "1000px" }}>
          <motion.span variants={lineVariants} style={{ display: "inline-block", transformOrigin: "bottom center", transformStyle: "preserve-3d" }}>
            {children}
          </motion.span>
        </span>
      ) : (
        /* Otherwise map through the lines/words */
        lines.map((line, index) => (
          <span key={index} style={{ display: "inline-block", overflow: "hidden", marginRight: "0.2em", paddingBottom: "4px", perspective: "1000px" }}>
            <motion.span variants={lineVariants} style={{ display: "inline-block", transformOrigin: "bottom center", transformStyle: "preserve-3d" }}>
              {line}
            </motion.span>
          </span>
        ))
      )}
    </motion.div>
  );
}