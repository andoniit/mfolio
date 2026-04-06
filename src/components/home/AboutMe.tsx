"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./AboutMe.module.scss";

gsap.registerPlugin(ScrollTrigger);

const paragraphText =
  "a software engineer with an artist’s eye, combining strong design thinking with production-minded engineering to build polished, user-first products. I focus on interaction quality, performance, and reliability, and I also create motion graphics, animation, and video edits to bring visual storytelling and high-craft UI to life.";

const greetings = ["Hello!", "¡Hola!", "Ola!", "こんにちは!", "안녕하세요!", "नमस्ते!"];

export default function AboutMe() {
  const [isAndon, setIsAndon] = useState(false);
  const hasAutoToggled = useRef(false);

  const sectionRef = useRef<HTMLElement>(null);

  const nameWrapperRef = useRef<HTMLDivElement>(null);
  const name1Ref = useRef<HTMLHeadingElement>(null);
  const name2Ref = useRef<HTMLHeadingElement>(null);

  const greetingWrapperRef = useRef<HTMLDivElement>(null);
  const introStaticRefs = useRef<(HTMLElement | null)[]>([]);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const allWordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const greetingsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const words = paragraphText.split(" ");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (!nameWrapperRef.current || !name1Ref.current || !name2Ref.current) return;

    const w1 = name1Ref.current.offsetWidth;
    const w2 = name2Ref.current.offsetWidth;

    gsap.to(nameWrapperRef.current, {
      width: isAndon ? w2 : w1,
      duration: 0.6,
      ease: "power3.inOut",
    });

    gsap.to(name1Ref.current, {
      opacity: isAndon ? 0 : 1,
      y: isAndon ? -15 : 0,
      duration: 0.6,
      ease: "power3.inOut",
      pointerEvents: isAndon ? "none" : "auto",
    });

    gsap.to(name2Ref.current, {
      opacity: isAndon ? 1 : 0,
      y: isAndon ? 0 : 15,
      duration: 0.6,
      ease: "power3.inOut",
      pointerEvents: isAndon ? "auto" : "none",
    });

    const handleResize = () => {
      gsap.set(nameWrapperRef.current, {
        width: isAndon ? name2Ref.current?.offsetWidth : name1Ref.current?.offsetWidth,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAndon]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(greetingsRef.current, { opacity: 0, rotationX: -90, y: 20 });
      gsap.set(introStaticRefs.current, { y: 30, opacity: 0 });
      gsap.set(allWordsRef.current, { y: 20, opacity: 0 });

      const firstGreetingWidth = greetingsRef.current[0]?.offsetWidth || 100;
      gsap.set(greetingWrapperRef.current, { width: firstGreetingWidth });

      if (nameWrapperRef.current && name1Ref.current) {
        gsap.set(nameWrapperRef.current, { width: name1Ref.current.offsetWidth });
        gsap.set(name2Ref.current, { opacity: 0, y: 15 });
      }

      const greetingTl = gsap.timeline({ repeat: -1, paused: true });
      greetingsRef.current.forEach((el, index) => {
        if (!el) return;
        const elWidth = el.offsetWidth;
        greetingTl
          .to(greetingWrapperRef.current, { width: elWidth, duration: 0.6, ease: "power3.inOut" }, `start-${index}`)
          .to(el, { opacity: 1, rotationX: 0, y: 0, duration: 0.8, ease: "back.out(1.7)" }, `start-${index}`)
          .to(el, { opacity: 0, rotationX: 90, y: -20, duration: 0.6, ease: "power3.in" }, `start-${index}+=1.8`);
      });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 75%",
        onEnter: () => {
          greetingTl.play();

          if (!hasAutoToggled.current) {
            hasAutoToggled.current = true;
            setTimeout(() => setIsAndon(true), 1500);
            setTimeout(() => setIsAndon(false), 2500);
          }
        },
        onEnterBack: () => greetingTl.play(),
        onLeave: () => greetingTl.pause(),
        onLeaveBack: () => greetingTl.pause(),
      });

      gsap.to(introStaticRefs.current, {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });

      gsap.to(allWordsRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.015,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });

      wordsRef.current.forEach((wordElement) => {
        if (!wordElement) return;
        const wordType = wordElement.dataset.wordType;
        let xTarget = "0em";

        if (wordType === "word1") xTarget = "-0.8em";
        if (wordType === "word2") xTarget = "1.6em";
        if (wordType === "word3") xTarget = "-2.4em";

        if (wordType !== "word0") {
          gsap.to(wordElement, {
            x: xTarget,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              end: "bottom 30%",
              scrub: 0.2,
            },
          });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about-me"
      className={styles.aboutMe}
      aria-label="About me"
    >
      <div className={styles.inner}>
        <div className={styles.rowGreeting}>
          <div ref={greetingWrapperRef} className={styles.greetingWrapper}>
            {greetings.map((text, i) => (
              <span
                key={i}
                ref={(el) => {
                  if (el) greetingsRef.current[i] = el;
                }}
                className={styles.greetingItem}
              >
                {text}
              </span>
            ))}
          </div>
          <span
            ref={(el) => {
              if (el) introStaticRefs.current[0] = el;
            }}
            className={styles.imStatic}
          >
            I'm
          </span>
        </div>

        <div
          ref={(el) => {
            if (el) introStaticRefs.current[1] = el;
          }}
          className={styles.rowName}
        >
          <div ref={nameWrapperRef} className={styles.nameWrapper}>
            <h2 ref={name1Ref} className={styles.nameHeading}>
              Anirudha Kapileshwari
            </h2>
            <h2 ref={name2Ref} className={styles.nameHeading}>
              ANDON
            </h2>
          </div>

          <label className={styles.switch}>
            <input type="checkbox" checked={isAndon} onChange={(e) => setIsAndon(e.target.checked)} />
            <span className={styles.slider} />
          </label>
        </div>

        <p className={styles.paragraph}>
          {words.map((word, i) => {
            const typeIndex = (i * 7 + 3) % 4;
            const wordType = `word${typeIndex}`;

            return (
              <span
                key={i}
                ref={(el) => {
                  if (el) {
                    allWordsRef.current[i] = el;
                    wordsRef.current.push(el);
                  }
                }}
                data-word-type={wordType}
                className={styles.word}
              >
                {word}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
