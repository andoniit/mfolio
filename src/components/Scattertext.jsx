"use client";

import { animate, hover } from "motion";
import { splitText } from "motion-plus";
import { useMotionValue } from "motion/react";
import { useEffect, useRef } from "react";

export default function ScatterText() {
  const containerRef = useRef(null);
  const velocityX = useMotionValue(0);
  const velocityY = useMotionValue(0);
  const prevEvent = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current.querySelector(".h1");
    if (!element) return;
    const { chars } = splitText(element);

    const handlePointerMove = (event) => {
      const now = performance.now();
      const timeSinceLastEvent = (now - prevEvent.current) / 1000; // seconds
      prevEvent.current = now;
      velocityX.set(event.movementX / timeSinceLastEvent);
      velocityY.set(event.movementY / timeSinceLastEvent);
    };

    document.addEventListener("pointermove", handlePointerMove);

    hover(chars, (element) => {
      const speed = Math.sqrt(
        velocityX.get() ** 2 + velocityY.get() ** 2
      );
      const angle = Math.atan2(velocityY.get(), velocityX.get());
      const distance = speed * 0.1;

      animate(
        element,
        {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
        },
        { type: "spring", stiffness: 100, damping: 50 }
      );
    });

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div className="scatter" ref={containerRef}>
      <h1 className="h1">"Imagine extraordinary in the ordinary"</h1>
      <Stylesheet />
    </div>
  );
}

function Stylesheet() {
  return (
    <style>{`
      .scatter {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100vw;
        height: 100vh;
        text-align: center;
        font-family: 'Tajawal', sans-serif;
        color: #0f1115;
      }
      .h1 {
        font-size: 4rem;
        font-weight: 200;
      }
      .split-char {
        will-change: transform, opacity;
      }
    `}</style>
  );
}