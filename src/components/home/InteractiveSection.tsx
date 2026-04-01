"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// The bio paragraph
const paragraphText =
  "a software engineer with an artist’s eye, combining strong design thinking with production-minded engineering to build polished, user-first products. I focus on interaction quality, performance, and reliability, and I also create motion graphics, animation, and video edits to bring visual storytelling and high-craft UI to life.";

// Added "Ola!" to the greetings array
const greetings = ["Hello!", "¡Hola!", "Ola!", "こんにちは!", "안녕하세요!", "नमस्ते!"];

export default function InteractiveSection() {
  const [isAndon, setIsAndon] = useState(false);
  const hasAutoToggled = useRef(false);

  const sectionRef = useRef<HTMLElement>(null);
  const bgDotsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLParagraphElement>(null);
  
  // Refs for the smooth name transition
  const nameWrapperRef = useRef<HTMLDivElement>(null);
  const name1Ref = useRef<HTMLHeadingElement>(null);
  const name2Ref = useRef<HTMLHeadingElement>(null);

  const greetingWrapperRef = useRef<HTMLDivElement>(null);
  const introStaticRefs = useRef<(HTMLElement | null)[]>([]); 
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]); 
  const allWordsRef = useRef<(HTMLSpanElement | null)[]>([]); 
  const greetingsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const stickersRef = useRef<(HTMLDivElement | null)[]>([]);

  const words = paragraphText.split(" ");

  // 1. Force Scroll Reset on Reload
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
  }, []);

  // 2. Smooth Transition for the Name & Switch
  useEffect(() => {
    if (!nameWrapperRef.current || !name1Ref.current || !name2Ref.current) return;

    const w1 = name1Ref.current.offsetWidth;
    const w2 = name2Ref.current.offsetWidth;

    // Animate the container width so the switch slides smoothly without jumping
    gsap.to(nameWrapperRef.current, {
      width: isAndon ? w2 : w1,
      duration: 0.6,
      ease: "power3.inOut"
    });

    // Fade and slide "Anirudha Kapileshwari"
    gsap.to(name1Ref.current, {
      opacity: isAndon ? 0 : 1,
      y: isAndon ? -15 : 0,
      duration: 0.6,
      ease: "power3.inOut",
      pointerEvents: isAndon ? "none" : "auto"
    });

    // Fade and slide "ANDON"
    gsap.to(name2Ref.current, {
      opacity: isAndon ? 1 : 0,
      y: isAndon ? 0 : 15,
      duration: 0.6,
      ease: "power3.inOut",
      pointerEvents: isAndon ? "auto" : "none"
    });

    // Handle Window Resizing to keep width accurate
    const handleResize = () => {
      gsap.set(nameWrapperRef.current, {
        width: isAndon ? name2Ref.current?.offsetWidth : name1Ref.current?.offsetWidth
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [isAndon]);

  // 3. Main GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // INITIAL SETUPS
      gsap.set(greetingsRef.current, { opacity: 0, rotationX: -90, y: 20 });
      gsap.set(introStaticRefs.current, { y: 30, opacity: 0 });
      gsap.set(allWordsRef.current, { y: 20, opacity: 0 });
      gsap.set(stickersRef.current, { scale: 0, opacity: 0 });

      // Set greeting initial width
      const firstGreetingWidth = greetingsRef.current[0]?.offsetWidth || 100;
      gsap.set(greetingWrapperRef.current, { width: firstGreetingWidth });

      // Set initial width for the name wrapper to prevent any flash
      if (nameWrapperRef.current && name1Ref.current) {
        gsap.set(nameWrapperRef.current, { width: name1Ref.current.offsetWidth });
        gsap.set(name2Ref.current, { opacity: 0, y: 15 });
      }

      // BACKGROUND DOTS ENTRY
      gsap.fromTo(
        bgDotsRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        }
      );

      // GREETING ANIMATION
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
          
          // Trigger the automatic switch flip ONCE when the user enters the section
          if (!hasAutoToggled.current) {
            hasAutoToggled.current = true;
            setTimeout(() => setIsAndon(true), 1500); // Flip to ANDON
            setTimeout(() => setIsAndon(false), 2500); // Flip back 1 sec later
          }
        },
        onEnterBack: () => greetingTl.play(),
        onLeave: () => greetingTl.pause(),
        onLeaveBack: () => greetingTl.pause(),
      });

      // HEADER ENTRY
      gsap.to(introStaticRefs.current, { 
        y: 0, 
        opacity: 1, 
        duration: 1, 
        stagger: 0.2, 
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
      });

      // MAIN PARAGRAPH ENTRY
      gsap.to(allWordsRef.current, { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        stagger: 0.015,
        ease: "power3.out", 
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
      });

      // MAIN TEXT SCATTER EFFECT
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

      // STICKERS ENTRY & CONTINUOUS FLOATING
      gsap.to(stickersRef.current, {
        scale: 1,
        opacity: 1,
        duration: 1.2,
        stagger: 0.15,
        ease: "back.out(1.5)",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        onComplete: () => {
          stickersRef.current.forEach((sticker, i) => {
            if (!sticker) return;
            gsap.to(sticker, {
              y: i % 2 === 0 ? "-=12" : "+=12",
              x: i === 1 ? "+=6" : "-=6",
              rotation: i === 2 ? "+=3" : "-=3",
              duration: 2.5 + i * 0.5,
              yoyo: true,
              repeat: -1,
              ease: "sine.inOut",
            });
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap');
          
          /* The switch - locked strictly to 20px */
          .switch {
            font-size: 15px; 
            position: relative;
            display: inline-block;
            width: 3.5em;
            height: 2em;
            flex-shrink: 0;
          }

          /* Hide default HTML checkbox */
          .switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          /* The slider */
          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 30px;
          }

          .slider:before {
            position: absolute;
            content: "";
            height: 1.4em;
            width: 1.4em;
            border-radius: 20px;
            left: 0.3em;
            bottom: 0.3em;
            background-color: white;
            transition: .3s cubic-bezier(0,2.18,.64,.69);
          }

          .switch input:checked + .slider {
            background-color: #3bd826;
          }

          .switch input:focus + .slider {
            box-shadow: 0 0 1px #3bd826;
          }

          .switch input:checked + .slider:before {
            transform: translateX(1.5em);
          }
        `}
      </style>

      {/* Main Section */}
      <section 
        ref={sectionRef}
        className="relative min-h-screen w-full flex items-center justify-center overflow-hidden py-24 px-6 lg:px-8"
      >
        <div 
          ref={bgDotsRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          style={{
            backgroundImage: "radial-gradient(#d1d5db 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "center center"
          }}
        />

        <div className="relative w-full max-w-4xl rounded-3xl p-6 sm:p-10 md:p-16 flex flex-col items-start justify-center z-10">
          
          {/* Stickers */}
          <div 
            ref={(el) => { if (el) stickersRef.current[0] = el; }}
            className="absolute -left-[5%] sm:-left-[15%] md:-left-[24%] bottom-[5%] sm:bottom-[15%] w-[40%] sm:w-[45%] max-w-[200px] sm:max-w-[250px] z-20 pointer-events-auto"
          >
            <img src="/stickers/iamcreative.png" alt="I'm Creative" className="w-full h-auto hover:scale-105 transition-transform duration-300" />
          </div>

          <div 
            ref={(el) => { if (el) stickersRef.current[1] = el; }}
            className="absolute -right-[2%] sm:-right-[8%] md:-right-[16%] top-[35%] sm:top-[40%] w-[35%] sm:w-[40%] max-w-[180px] sm:max-w-[220px] z-20 pointer-events-auto"
          >
            <img src="/stickers/madein1999.png" alt="Made in 1999" className="w-full h-auto rotate-[6deg] hover:scale-105 hover:rotate-[12deg] transition-all duration-300" />
          </div>

          <div 
            ref={(el) => { if (el) stickersRef.current[2] = el; }}
            className="absolute right-[0%] sm:-right-[8%] md:-right-[12%] bottom-[10%] sm:bottom-[20%] w-[20%] sm:w-[25%] max-w-[100px] sm:max-w-[130px] z-20 pointer-events-auto"
          >
            <img src="/stickers/tecchheart.png" alt="Tech Heart" className="w-full h-auto -rotate-[12deg] hover:scale-105 hover:-rotate-[4deg] transition-all duration-300" />
          </div>

          {/* ROW 1: "Hello! I'm" */}
          <div className="flex flex-row items-center gap-2 md:gap-3 mb-1 w-full text-[clamp(24px,4vw,36px)] font-medium text-black">
            <div ref={greetingWrapperRef} className="relative h-[1.2em] perspective-[800px] shrink-0 overflow-visible">
              {greetings.map((text, i) => (
                <span key={i} ref={(el) => { if (el) greetingsRef.current[i] = el; }} className="absolute bottom-0 left-0 leading-none transform-gpu will-change-transform whitespace-nowrap" style={{ color: "#000000" }}>
                  {text}
                </span>
              ))}
            </div>
            <span ref={(el) => { if(el) introStaticRefs.current[0] = el; }} className="leading-none text-[#1a1a1a]">
              I'm
            </span>
          </div>

          {/* ROW 2: NAME BLOCK WITH SMOOTH SWITCH ON A SINGLE LINE */}
          <div 
            ref={(el) => { if(el) introStaticRefs.current[1] = el; }} 
            className="mb-8 md:mb-12 relative z-10 flex flex-row items-center gap-4 md:gap-6 flex-nowrap w-full"
          >
            {/* The animated wrapper for smooth width changes, taking on the text size to compute em height correctly */}
            <div ref={nameWrapperRef} className="relative h-[1.3em] text-[clamp(36px,4vw,70px)] overflow-visible shrink-0">
              <h2 
                ref={name1Ref} 
                className="absolute top-0 left-0 font-['Shadows_Into_Light',_cursive] text-[#ff3636] leading-none whitespace-nowrap"
              >
                Anirudha Kapileshwari
              </h2>
              <h2 
                ref={name2Ref} 
                className="absolute top-0 left-0 font-['Shadows_Into_Light',_cursive] text-[#ff3636] leading-none whitespace-nowrap"
              >
                ANDON
              </h2>
            </div>

            {/* The Switch - Removed translation, items-center handles the vertical centering */}
            <label className="switch shrink-0">
              <input 
                type="checkbox" 
                checked={isAndon} 
                onChange={(e) => setIsAndon(e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* BOTTOM PART: Scattered paragraph */}
          <p
            ref={containerRef}
            className="text-[clamp(18px,2.5vw,36px)] font-medium tracking-tight leading-[1.3] text-[#1a1a1a] text-left max-w-[95%] z-10 relative"
          >
            {words.map((word, i) => {
              const typeIndex = (i * 7 + 3) % 4;
              const wordType = `word${typeIndex}`;
              let paddingClass = "";
              if (wordType === "word1") paddingClass = "pl-[0.8em]";
              if (wordType === "word2") paddingClass = "pr-[1.6em]";
              if (wordType === "word3") paddingClass = "pl-[2.4em]";

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
                  className={`inline-block will-change-transform ${paddingClass} mx-[0.15em]`}
                >
                  {word}
                </span>
              );
            })}
          </p>

        </div>
      </section>
    </>
  );
}