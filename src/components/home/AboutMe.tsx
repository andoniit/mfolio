"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  splitTextIntoWordNodes,
  updateScrollWordReveal,
  setScrollWordsFullyVisible,
} from "@/lib/scrollWordReveal";
import styles from "./AboutMe.module.scss";
import PortfolioMonthTray from "./PortfolioMonthTray";

gsap.registerPlugin(ScrollTrigger);

/** Subtle word chip behind copy (adapted from cg-navigate-scroll-animated-text). */
const BIO_WORD_HIGHLIGHT_RGB = "28, 28, 28";

const paragraphText =
  "a software engineer with an artist's eye, combining strong design thinking with production-minded engineering to build polished, user-first products. I focus on interaction quality, performance, and reliability, and I also create motion graphics, animation, and video edits to bring visual storytelling and high-craft UI to life.";

/** Red bio scroll-reveal (tuned separately from MyVision poem). */
const BIO_SCROLL_REVEAL_VH = 1.1;
const BIO_SCROLL_REVEAL_MAX_PX = 580;
const BIO_SCROLL_SCRUB = 0.34;
const BIO_WORD_OVERLAP = 17;

const seahawksMarqueeChunk = "Go hawks !!   ";

/** One word per band; duplicate in markup for seamless vertical loop. */
const OPEN_TO_WORK_PILLS = [
  { pill: "pillYellow" as const, word: "open" },
  { pill: "pillBlue" as const, word: "to" },
  { pill: "pillRed" as const, word: "work" },
];

const PORTFOLIO_YEAR_START = 2019;
const PORTFOLIO_YEAR_END = 2026;

const MEMOJI_VIDEO_SRC = "/Video/memoji-andon.mov";

/** Deterministic “scattered piece” offsets so each bento tile starts apart, then snaps home. */
function puzzlePieceX(i: number): number {
  return ((i * 73 + 11) % 200) - 100;
}

function puzzlePieceY(i: number): number {
  return (((i + 2) * 59 + 19) % 170) - 85;
}

function puzzlePieceRotation(i: number): number {
  return ((i * 37 + 5) % 54) - 27;
}

export default function AboutMe() {
  const sectionRef = useRef<HTMLElement>(null);
  const [time, setTime] = useState("8:55am");
  const [portfolioYear, setPortfolioYear] = useState(PORTFOLIO_YEAR_START);
  const [isAndon, setIsAndon] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const legalNameRef = useRef<HTMLDivElement>(null);
  const andonNameRef = useRef<HTMLDivElement>(null);
  const nameTogglePrev = useRef<boolean | null>(null);
  const memojiBoxRef = useRef<HTMLDivElement>(null);
  const memojiVideoRef = useRef<HTMLVideoElement>(null);
  const bioParagraphRef = useRef<HTMLParagraphElement>(null);
  const bioAnimeContainerRef = useRef<HTMLDivElement>(null);
  const portfolioBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const seattleTime = new Date().toLocaleTimeString("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).toLowerCase();
      setTime(seattleTime.replace(" ", ""));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const span = PORTFOLIO_YEAR_END - PORTFOLIO_YEAR_START;
        const stepMs = 95;
        for (let i = 0; i <= span; i++) {
          timeouts.push(
            setTimeout(() => {
              setPortfolioYear(PORTFOLIO_YEAR_START + i);
            }, i * stepMs)
          );
        }
      },
    });

    return () => {
      st.kill();
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    const legal = legalNameRef.current;
    const andon = andonNameRef.current;
    if (!legal || !andon) return;

    gsap.set([legal, andon], { transformPerspective: 720 });

    if (nameTogglePrev.current === null) {
      nameTogglePrev.current = isAndon;
      if (isAndon) {
        gsap.set(legal, { opacity: 0, y: 0, rotateX: 0, scale: 1 });
        gsap.set(andon, { opacity: 1, y: 0, rotateX: 0, scale: 1 });
      } else {
        gsap.set(legal, { opacity: 1, y: 0, rotateX: 0, scale: 1 });
        gsap.set(andon, { opacity: 0, y: 0, rotateX: 0, scale: 1 });
      }
      return;
    }

    if (nameTogglePrev.current === isAndon) return;
    nameTogglePrev.current = isAndon;

    if (isAndon) {
      gsap
        .timeline({ defaults: { ease: "power2.inOut" } })
        .to(legal, {
          opacity: 0,
          y: -22,
          rotateX: -58,
          scale: 0.92,
          duration: 0.38,
          ease: "power2.in",
        })
        .fromTo(
          andon,
          { opacity: 0, y: 26, rotateX: 52, scale: 0.82 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.52,
            ease: "back.out(1.45)",
          },
          "-=0.12"
        );
    } else {
      gsap
        .timeline({ defaults: { ease: "power2.inOut" } })
        .to(andon, {
          opacity: 0,
          y: 20,
          rotateX: 52,
          scale: 0.88,
          duration: 0.36,
          ease: "power2.in",
        })
        .fromTo(
          legal,
          { opacity: 0, y: -26, rotateX: -52, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.25)",
          },
          "-=0.1"
        );
    }
  }, [isAndon]);

  useEffect(() => {
    const video = memojiVideoRef.current;
    if (video) {
      video.muted = true;
      video.volume = 0;
    }
  }, []);

  useEffect(() => {
    const box = memojiBoxRef.current;
    const video = memojiVideoRef.current;
    if (!box || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          video.muted = true;
          video.volume = 0;
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const trigger = sectionRef.current;
      if (!trigger) return;

      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const scrollOpts = {
        trigger,
        start: "top 78%",
        once: true,
      } as const;

      const markIntroComplete = () => setIntroComplete(true);

      if (reducedMotion) {
        gsap.from(".bento-anim", {
          opacity: 0,
          y: 14,
          duration: 0.38,
          stagger: { each: 0.045, from: "start" },
          ease: "power2.out",
          scrollTrigger: scrollOpts,
          onComplete: markIntroComplete,
        });
      } else {
        gsap.from(".bento-anim", {
          x: (i: number) => puzzlePieceX(i),
          y: (i: number) => puzzlePieceY(i),
          rotation: (i: number) => puzzlePieceRotation(i),
          scale: 0.93,
          opacity: 0.9,
          duration: 0.95,
          ease: "back.out(1.14)",
          stagger: { each: 0.068, from: "random" },
          transformOrigin: "50% 50%",
          scrollTrigger: scrollOpts,
          onComplete: markIntroComplete,
        });
      }

      const bioEl = bioParagraphRef.current;
      const bioScrollRoot = bioAnimeContainerRef.current;
      if (bioEl && bioScrollRoot) {
        splitTextIntoWordNodes(bioEl, paragraphText, styles.bioWord, styles.bioWordSpan);

        if (reducedMotion) {
          setScrollWordsFullyVisible(bioScrollRoot);
        } else {
          const rgb = BIO_WORD_HIGHLIGHT_RGB;
          updateScrollWordReveal(0, bioScrollRoot, rgb);
          ScrollTrigger.create({
            trigger: bioScrollRoot,
            start: "top 86%",
            end: () =>
              `+=${Math.min(
                typeof window !== "undefined"
                  ? window.innerHeight * BIO_SCROLL_REVEAL_VH
                  : 560,
                BIO_SCROLL_REVEAL_MAX_PX
              )}`,
            scrub: BIO_SCROLL_SCRUB,
            invalidateOnRefresh: true,
            onUpdate: (self) =>
              updateScrollWordReveal(
                self.progress,
                bioScrollRoot,
                rgb,
                BIO_WORD_OVERLAP
              ),
          });
        }
      }

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about-me"
      className={styles.aboutMe}
      aria-label="About me"
      lang="en"
    >
      <div className={styles.bentoGrid}>
        {/* Column 1 */}
        <div className={`${styles.column} ${styles.col1}`}>
          <div className={`${styles.bentoItem} ${styles.redBox1} bento-anim`}>
            {introComplete ? (
              <PortfolioMonthTray portfolioBlockRef={portfolioBlockRef} />
            ) : null}
            <div ref={portfolioBlockRef} className={styles.portfolioBlock}>
              <span className={styles.portfolioTitle}>portfolio</span>
              <span className={styles.portfolioYear} aria-live="polite">
                {portfolioYear}
              </span>
            </div>
          </div>
          <div className={`${styles.bentoItem} ${styles.gradPhoto} bento-anim`}>
            <img src="/images/1.jpg" alt="Graduation" />
          </div>
        </div>

        {/* Column 2 */}
        <div className={`${styles.column} ${styles.col2}`}>
          <div className={`${styles.bentoItem} ${styles.purpleBox} bento-anim`}>
            <div className={styles.purpleInner}>
              <p className={styles.purpleIam}>I am</p>
              <div className={styles.purpleSpacer} aria-hidden="true" />
              <div className={styles.purpleBottom}>
                <div className={styles.purpleNameStage}>
                  <div ref={legalNameRef} className={styles.purpleLegal}>
                    <span className={styles.purpleNameLine}>Anirudha</span>
                    <span className={styles.purpleNameLine}>Kapileshwari</span>
                  </div>
                  <div ref={andonNameRef} className={styles.purpleAndon}>
                    Andon
                  </div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={isAndon}
                    onChange={(e) => setIsAndon(e.target.checked)}
                    aria-checked={isAndon}
                    aria-label="Toggle between full name and Andon"
                  />
                  <span className={styles.slider} />
                </label>
              </div>
            </div>
          </div>
          <div
            ref={memojiBoxRef}
            className={`${styles.bentoItem} ${styles.blueBox2} bento-anim`}
          >
            <div className={styles.memojiVideoWrap}>
              <video
                ref={memojiVideoRef}
                className={styles.memojiVideo}
                src={MEMOJI_VIDEO_SRC}
                loop
                muted
                playsInline
                preload="metadata"
                controls={false}
                aria-label="Memoji animation (silent, looping)"
              />
            </div>
          </div>
          <div
            className={`${styles.pillsRow} bento-anim`}
            role="group"
            aria-label="Open to work"
          >
            {OPEN_TO_WORK_PILLS.map(({ pill, word }) => (
              <div key={word} className={`${styles.pill} ${styles[pill]}`}>
                <div className={styles.pillMarquee}>
                  <div className={styles.pillMarqueeTrack}>
                    <span className={styles.pillMarqueeText}>{word}</span>
                    <span className={styles.pillMarqueeText} aria-hidden="true">
                      {word}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            className={`${styles.bentoItem} ${styles.yellowBox} bento-anim`}
            tabIndex={0}
            aria-label="Based in Seattle, Washington. Hover for more."
          >
            <div className={styles.locationCard}>
              <div className={styles.locationDefault}>
                <span className={styles.locationFrom}>I am based in</span>
                <div className={styles.locationRight}>
                  <span className={styles.locationTime}>{time}</span>
                  <span className={styles.locationCity}>Seattle, WA</span>
                </div>
              </div>
              <div className={styles.locationHover} aria-hidden="true">
                <div className={styles.marquee}>
                  <div className={styles.marqueeTrack}>
                    <span className={styles.marqueeHalf}>
                      {seahawksMarqueeChunk}
                      {seahawksMarqueeChunk}
                      {seahawksMarqueeChunk}
                      {seahawksMarqueeChunk}
                    </span>
                    <span className={styles.marqueeHalf}>
                      {seahawksMarqueeChunk}
                      {seahawksMarqueeChunk}
                      {seahawksMarqueeChunk}
                      {seahawksMarqueeChunk}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 */}
        <div className={`${styles.column} ${styles.col3}`}>
          <div className={`${styles.bentoItem} ${styles.suitPhoto} bento-anim`}>
            <img src="/images/25.jpg" alt="Suit" />
          </div>
          <div className={`${styles.bentoItem} ${styles.redBoxText} bento-anim`}>
            <div
              className={styles.redBoxTextInner}
              aria-labelledby="about-bio-a11y"
            >
              <span id="about-bio-a11y" className={styles.bioAssistive}>
                {paragraphText}
              </span>
              <div ref={bioAnimeContainerRef} className={styles.bioAnimeScroll}>
                <div className={styles.bioAnimeText}>
                  <p
                    ref={bioParagraphRef}
                    className={styles.paragraph}
                    aria-hidden="true"
                  />
                </div>
              </div>
              <noscript>
                <p className={styles.paragraph}>{paragraphText}</p>
              </noscript>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}