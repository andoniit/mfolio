"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function AnimatedDivider({ className = "", orientation = "vertical" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  const isVertical = orientation === "vertical";

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ 
        scaleY: isVertical ? 0 : 1, 
        scaleX: isVertical ? 1 : 0, 
        opacity: 0 
      }}
      animate={isInView ? { 
        scaleY: 1, 
        scaleX: 1, 
        opacity: 1 
      } : {}}
      transition={{ 
        duration: 1.2, 
        ease: [0.16, 1, 0.3, 1], // power4.out
        delay: 0.1 
      }}
      style={{ 
        transformOrigin: isVertical ? "top center" : "center left",
        willChange: "transform, opacity"
      }}
    />
  );
}