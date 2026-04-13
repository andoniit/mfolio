"use client";
import React, { useRef, useEffect } from "react";
import AnimatedIntroText from "./AnimatedIntroText";
import SplitterText from "./SplitterText";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MyVision() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Simple intro animation (slide up, scale up slightly, fade in)
    gsap.fromTo(
      container,
      { opacity: 0, y: 60, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if(t.trigger === container) t.kill();
      });
    };
  }, []);

  return (
    <section id="my-vision" aria-label="My Vision" className="pitch-section">
      <h2 className="sr-only">My Vision</h2>
      <div style={{ width: "100%", maxWidth: "1200px", display: "flex", justifyContent: "center" }}>
        <div 
          className="pitch-container" 
          ref={containerRef}
        >
          <div className="pitch-frame">
            <div className="top-left-tab mf-red-text">
              <AnimatedIntroText>Imagine extraordinary</AnimatedIntroText>
            </div>
            
            <div className="bottom-right-tab mf-purple-text">
              <AnimatedIntroText>In the ordinary</AnimatedIntroText>
            </div>
          </div>
        </div>
      </div>
      
      <div className="poem-container mf-dark-text">
        <SplitterText isBlock={true} variant="fastv2">
          A barefoot dream wrapped in imagination, Lines of vision shaping inspiration. A sneaker drawn, yet never worn, A canvas of thought where ideas are born. The artist’s mind, a realm so wide, Where limits fade and dreams collide. No riches needed, no gold in hand, For design builds castles where feet can stand. A stroke of art, a future untold, Where designers craft, their dreams unfold. For they afford, through ink and air, A world designed beyond compare.
        </SplitterText>
      </div>

      <Stylesheet />
    </section>
  );
}

function Stylesheet() {
  return (
    <style>{`
      @font-face {
        font-family: 'Coolvetica';
        src: url('/fonts/Coolvetica Rg.otf') format('opentype');
        font-weight: normal;
        font-style: normal;
      }

      .pitch-section {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4rem 2rem 3rem;
        margin-top: 4rem;
        margin-bottom: 2rem;
      }

      .pitch-container {
        position: relative;
        width: 100%;
        max-width: 1200px;
        aspect-ratio: 16 / 9; /* Changed to horizontal layout */
        background-image: url('/icons/4.PNG');
        background-size: cover;
        background-position: center bottom;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .pitch-frame {
        position: absolute;
        top: 5%;
        left: 4%;
        right: 4%;
        bottom: 6%;
        border: 16px solid white;
        border-radius: 40px;
      }

      .top-left-tab {
        position: absolute;
        top: -16px;
        left: -16px;
        background: white;
        color: #000;
        font-family: 'Coolvetica', sans-serif;
        font-size: clamp(1.8rem, 3.5vw, 2.5rem);
        padding: 15px 40px 20px 40px;
        border-bottom-right-radius: 30px;
        border-top-left-radius: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.05em;
      }

      .extraordinary {
        color: #ea3e3e;
      }

      /* Inverted curves for the top-left tab */
      .top-left-tab::before {
        content: '';
        position: absolute;
        right: -40px;
        top: 16px;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle at 100% 100%, transparent 39px, white 40px);
      }

      .top-left-tab::after {
        content: '';
        position: absolute;
        left: 16px;
        bottom: -40px;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle at 100% 100%, transparent 39px, white 40px);
      }

      .bottom-right-tab {
        position: absolute;
        bottom: -16px;
        right: -16px;
        background: white;
        color: #000;
        font-family: 'Coolvetica', sans-serif;
        font-size: clamp(2rem, 5vw, 3.5rem);
        padding: 15px 40px 10px 40px;
        border-top-left-radius: 40px;
        border-bottom-right-radius: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.05em;
      }

      /* Inverted curves for the bottom-right tab */
      .bottom-right-tab::before {
        content: '';
        position: absolute;
        left: -40px;
        bottom: 16px;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle at 0% 0%, transparent 39px, white 40px);
      }

      .bottom-right-tab::after {
        content: '';
        position: absolute;
        right: 16px;
        top: -40px;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle at 0% 0%, transparent 39px, white 40px);
      }

      .mf-red-text {
        color: var(--mf-red, #ea3e3e);
      }
      .mf-purple-text {
        color: var(--mf-purple, #6b63f7);
      }
      .mf-red-text *, .mf-purple-text * {
        color: inherit !important;
      }
      
      .mf-dark-text {
        color: var(--mf-dark, #343434);
      }
      .mf-dark-text * {
        color: inherit !important;
      }
      
      .poem-container {
        margin-top: 5rem;
        max-width: 900px;
        text-align: center;
        font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        font-size: clamp(0.9rem, 1.5vw, 1.1rem); /* Made the text smaller as requested */
        line-height: 1.8;
      }

      .poem-container p {
        margin: 0;
        /* Let SplitterText handle the display */
      }

      @media (max-width: 768px) {
        .pitch-container {
          aspect-ratio: auto;
          min-height: 60vh;
        }
        
        .pitch-frame {
          border-width: 10px;
          border-radius: 20px;
        }

        .top-left-tab {
          top: -10px;
          left: -10px;
          font-size: 1.2rem;
          padding: 10px 20px 15px 20px;
          border-bottom-right-radius: 20px;
          border-top-left-radius: 20px;
        }
        
        .top-left-tab::before, .top-left-tab::after {
          width: 20px;
          height: 20px;
        }
        .top-left-tab::before {
          right: -20px;
          top: 10px;
          background: radial-gradient(circle at 100% 100%, transparent 19px, white 20px);
        }
        .top-left-tab::after {
          left: 10px;
          bottom: -20px;
          background: radial-gradient(circle at 100% 100%, transparent 19px, white 20px);
        }

        .bottom-right-tab {
          bottom: -10px;
          right: -10px;
          font-size: 1.8rem;
          padding: 10px 20px 10px 20px;
          border-top-left-radius: 20px;
          border-bottom-right-radius: 20px;
        }

        .bottom-right-tab::before, .bottom-right-tab::after {
          width: 20px;
          height: 20px;
        }
        .bottom-right-tab::before {
          left: -20px;
          bottom: 10px;
          background: radial-gradient(circle at 0% 0%, transparent 19px, white 20px);
        }
        .bottom-right-tab::after {
          right: 10px;
          top: -20px;
          background: radial-gradient(circle at 0% 0%, transparent 19px, white 20px);
        }

        .poem-container {
          margin-top: 4rem;
          font-size: 1rem;
          padding: 0 1rem;
        }
      }
    `}</style>
  );
}
