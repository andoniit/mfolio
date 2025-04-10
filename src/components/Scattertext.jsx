"use client";
import Image from 'next/image';

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
      <div className="half left">
        <h1 className="h1">
          "Imagine <span className="extraordinary">extraordinary</span> in the ordinary"
        </h1>
      </div>
      <div className="half right">
        <img src="/4.PNG" alt="Scatter Image" />
        <div className="overlay-text">
          <p>A barefoot dream wrapped in imagination,</p>
          <p>Lines of vision shaping inspiration.</p>
          <p>A sneaker drawn, yet never worn,</p>
          <p>A canvas of thought where ideas are born.</p>
          <br />
          <p>The artist’s mind, a realm so wide,</p>
          <p>Where limits fade and dreams collide.</p>
          <p>No riches needed, no gold in hand,</p>
          <p>For design builds castles where feet can stand.</p>
          <br />
          <p>A stroke of art, a future untold,</p>
          <p>Where designers craft, their dreams unfold.</p>
          <p>For they afford, through ink and air,</p>
          <p>A world designed beyond compare.</p>
        </div>
      </div>
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
        width: 88vw;
        height: 100vh;
        overflow: hidden;
        text-align: left;
        font-family: 'Tajawal', sans-serif;
        color: #0f1115;
        margin-left:11em;
      }
      .h1 {
        font-size: 8rem;
        font-weight: 200;
        line-height: 1; /* Reduced line spacing */
      }
      
      .split-char {
        will-change: transform, opacity;
        overflow: hidden;
      }
      .extraordinary {
        color: #ff0000;
        overflow: hidden;
      }

      .half {
        width: 50%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .half.right {
        position: relative;
      }

      .half.right img {
        max-width: 100%;
        height: auto;
        border-radius: 20px;
      }

      .overlay-text {
        position: absolute;
        bottom: 0;
        left: 0;
        background: rgb(255, 255, 255);
        color: #333;
        padding: 10px;
        font-size: 1rem;
        max-width: 90%;
        border-radius: 20px;
      }

      @media screen and (max-width: 768px) {
        .scatter {
          flex-direction: column;
          width: 100vw;
          margin-left: 0;
          height: 160vh;
          padding: 1em;
          margin-top:-20em;
        }
        .half {
          width: 100%;
          height: auto;
        }
        .h1 {
          font-size: 2rem; /* reduced from 4rem */
          text-align: center;
          margin: 1em 0;
        }
        .half.right img {
          width: 100%;
          height: auto;
        }
        .overlay-text {
          font-size: 0.8rem;
          padding: 8px;
          max-width: 95%;
          
          left: 10%;
          transform: translateX(-10%);
          margin: -20em 0em ;
        }
      }
    `}</style>
  );
}