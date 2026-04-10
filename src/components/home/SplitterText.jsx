"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function SplitterText({ children, text = "", className = "", variant = "soft", isBlock = false }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  const rawText = text || (typeof children === "string" ? children : "");
  
  // Real DOM line-splitting requires a heavy library like GSAP SplitText.
  // Splitting by words and wrapping them in an inline-block overflow mask 
  // produces a nearly identical responsive line-reveal masking effect.
  const lines = Array.isArray(rawText) 
    ? rawText 
    : typeof rawText === "string" 
      ? rawText.includes('\n') ? rawText.split('\n') : rawText.split(' ')
      : [rawText];

  let stagger = 0.08;
  let delay = 0;
  let initialY = "110%";
  let initialOpacity = 1;
  let ease = [0.16, 1, 0.3, 1]; // power4.out equivalent
  let duration = 1;

  if (variant === "fast") {
    stagger = 0.07;
    delay = 0.04;
    initialY = "110%";
    initialOpacity = 1; // opacity stays 1, relies purely on the overflow mask
    ease = [0.25, 1, 0.5, 1]; // approximation for "ccv"
  } else if (variant === "fastv2") {
    stagger = 0.09;
    delay = 0.04;
    initialY = "120%";
    initialOpacity = 1;
    ease = [0.16, 1, 0.3, 1]; // power4.out
  } else if (variant === "soft") {
    stagger = 0.08;
    delay = 0;
    initialY = "110%";
    initialOpacity = 0; // soft also fades opacity from 0
    ease = [0.16, 1, 0.3, 1]; // power4.out
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const lineVariants = {
    hidden: { 
      y: initialY,
      opacity: initialOpacity 
    },
    visible: { 
      y: "0%",
      opacity: 1,
      transition: {
        duration: duration,
        ease: ease
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {!text && typeof children !== "string" ? (
        <span style={{ display: isBlock ? "block" : "inline-block", overflow: "hidden", paddingBottom: "4px", verticalAlign: "bottom" }}>
          <motion.span variants={lineVariants} style={{ display: isBlock ? "block" : "inline-block", transformOrigin: "bottom center" }}>
            {children}
          </motion.span>
        </span>
      ) : (
        lines.map((line, index) => (
          <span key={index} style={{ display: "inline-block", overflow: "hidden", marginRight: "0.2em", paddingBottom: "4px", verticalAlign: "bottom" }}>
            <motion.span variants={lineVariants} style={{ display: "inline-block", transformOrigin: "bottom center" }}>
              {line}
            </motion.span>
          </span>
        ))
      )}
    </motion.div>
  );
}