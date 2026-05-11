"use client";
import React, { useRef, useEffect } from "react";
import AnimatedIntroText from "./AnimatedIntroText";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  splitTextIntoWordNodes,
  updateScrollWordReveal,
  setScrollWordsFullyVisible,
} from "@/lib/scrollWordReveal";
import styles from "./MyVision.module.scss";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const VISION_POEM_TEXT =
  "A barefoot dream wrapped in imagination, Lines of vision shaping inspiration. A sneaker drawn, yet never worn, A canvas of thought where ideas are born. The artist’s mind, a realm so wide, Where limits fade and dreams collide. No riches needed, no gold in hand, For design builds castles where feet can stand. A stroke of art, a future untold, Where designers craft, their dreams unfold. For they afford, through ink and air, A world designed beyond compare.";

const VISION_WORD_HIGHLIGHT_RGB = "72, 72, 72";
const VISION_CHIP_ALPHA = 0.2;

/** Poem scroll-reveal: tuned separately from AboutMe red bio (`BIO_*` in AboutMe.tsx). */
const VISION_POEM_SCROLL_VH = 1.02;
const VISION_POEM_SCROLL_MAX_PX = 520;
const VISION_POEM_SCRUB = 0.3;
const VISION_POEM_WORD_OVERLAP = 14;

export default function MyVision() {
  const containerRef = useRef(null);
  const poemParagraphRef = useRef(null);
  const poemAnimeRootRef = useRef(null);

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
        duration: 1.65,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container,
          start: "top 82%",
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

  useEffect(() => {
    const root = poemAnimeRootRef.current;
    const p = poemParagraphRef.current;
    if (!root || !p) return;

    const ctx = gsap.context(() => {
      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      splitTextIntoWordNodes(p, VISION_POEM_TEXT, styles.visionWord, styles.visionWordSpan);

      if (reducedMotion) {
        setScrollWordsFullyVisible(root);
      } else {
        const rgb = VISION_WORD_HIGHLIGHT_RGB;
        updateScrollWordReveal(0, root, rgb, VISION_POEM_WORD_OVERLAP, VISION_CHIP_ALPHA);
        ScrollTrigger.create({
          trigger: root,
          start: "top 90%",
          end: () =>
            `+=${Math.min(
              typeof window !== "undefined"
                ? window.innerHeight * VISION_POEM_SCROLL_VH
                : 440,
              VISION_POEM_SCROLL_MAX_PX
            )}`,
          scrub: VISION_POEM_SCRUB,
          invalidateOnRefresh: true,
          onUpdate: (self) =>
            updateScrollWordReveal(
              self.progress,
              root,
              rgb,
              VISION_POEM_WORD_OVERLAP,
              VISION_CHIP_ALPHA
            ),
        });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section id="my-vision" aria-label="My Vision" className="pitch-section" lang="en">
      <h2 className="sr-only">My Vision</h2>
      <div style={{ width: "100%", maxWidth: "1200px", display: "flex", justifyContent: "center" }}>
        <div 
          className="pitch-container" 
          ref={containerRef}
        >
          <div className="pitch-frame">
            <div className="top-left-tab mf-red-text">
              <AnimatedIntroText staggerDelay={0.1} motionDuration={1.55}>
                Imagine extraordinary
              </AnimatedIntroText>
            </div>

            <div className="bottom-right-tab mf-purple-text">
              <AnimatedIntroText staggerDelay={0.1} motionDuration={1.55}>
                In the ordinary
              </AnimatedIntroText>
            </div>
          </div>
        </div>
      </div>
      
      <div className="poem-container mf-dark-text">
        <span id="my-vision-poem-a11y" className="sr-only">
          {VISION_POEM_TEXT}
        </span>
        <div ref={poemAnimeRootRef} className={styles.visionPoemScroll} aria-labelledby="my-vision-poem-a11y">
          <div className={styles.visionPoemText}>
            <p ref={poemParagraphRef} className={styles.visionParagraph} aria-hidden="true" />
          </div>
        </div>
        <noscript>
          <p className={styles.visionParagraph}>{VISION_POEM_TEXT}</p>
        </noscript>
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
        width: 100%;
        padding-inline: clamp(0.75rem, 4vw, 1.5rem);
        box-sizing: border-box;
        text-align: center;
        font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        font-size: clamp(0.95rem, 0.88rem + 1.35vmin + 0.35vw, 1.38rem);
        line-height: 1.72;
      }

      .poem-container p {
        margin: 0;
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
          font-size: clamp(0.9rem, 0.82rem + 1.1vmin, 1.14rem);
          line-height: 1.68;
          padding-inline: clamp(0.65rem, 3.5vw, 1rem);
        }
      }
    `}</style>
  );
}
