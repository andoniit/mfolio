"use client";
import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Dummy data for the setups (title attribute removed as requested)
const DESK_SETUPS = [
  {
    id: 1,
    src: "/my setup/1.jpg",
    tlTab: "First Personal Desk",
    brTab: "2018",
    description: "This was my very first personal desk setup, and it means a lot to me. Before this, I shared a family computer in the living room, so finally having my own room and my own workspace felt like a huge milestone. It was also the first brand-new PC I built for myself, which made this setup even more special and memorable."
  },
  {
    id: 2,
    src: "/my setup/2.jpg",
    tlTab: "Started Gaming",
    brTab: "2020",
    description: "This setup marked the beginning of my gaming journey. What started with casual matches of CS:GO with friends soon turned into long nights of playing Valorant and story-driven games. As gaming became a bigger part of my life, I began upgrading my PC to keep up with both performance and the excitement of discovering new worlds."
  },
  {
    id: 3,
    src: "/my setup/3.jpg",
    tlTab: "Streaming Setup",
    brTab: "2021",
    description: "This was the phase when my setup became more than just a gaming station—it became my streaming space. I started live streaming gameplay on YouTube and Twitch, which pushed me to upgrade everything: a dual-monitor setup, a Ryzen 9 processor, an RTX 2060 Super, a mechanical keyboard, and a Razer gaming mouse. It felt like a serious step into building a creative and performance-driven workspace."
  },
  {
    id: 4,
    src: "/my setup/4.jpg",
    tlTab: "Chicago First Desk",
    brTab: "2023",
    description: "This was my first setup after moving to Chicago for my Master’s in Computer Science. I combined a desk from Target with another table from Amazon to create an L-shaped workspace that fit both studying and everyday use. It was simple, practical, and became the place where I spent long hours learning, building, and adjusting to a new chapter of life."
  },
  {
    id: 5,
    src: "/my setup/5.jpg",
    tlTab: "Master's 2nd Semester",
    brTab: "2024",
    description: "By my second semester, I had moved into a smaller apartment and had to let go of the larger Target desk because I no longer had the space for it. This setup reflects a time of adapting—learning how to make the most of a smaller room while still keeping a functional and inspiring workspace. It was a reminder that every setup evolves with life."
  },
  {
    id: 6,
    src: "/my setup/6.jpg",
    tlTab: "Shift to a New Apt",
    brTab: "2024",
    description: "In my third semester, I moved again and rebuilt my workspace with a new L-shaped desk, this time with a more playful and expressive feel. It was a fresh start in a new apartment, and I wanted the setup to feel energetic and personal. Every move taught me how much my environment shaped the way I worked, created, and stayed motivated."
  },
  {
    id: 7,
    src: "/my setup/7.jpg",
    tlTab: "The Move In",
    brTab: "2025",
    description: "This setup came together after I moved in with my partner. We designed the space as a matching his-and-hers theme, making the studio apartment feel shared, cozy, and intentional. It was more than just arranging desks—it was about building a home workspace that reflected both of us and creating a balanced space for work, creativity, and everyday life."
  },
  {
    id: 8,
    src: "/my setup/8.jpg",
    tlTab: "Moved to Seattle",
    brTab: "2026",
    description: "This is my current setup after moving to Seattle, a city I had always imagined living in because of its strong connection to tech and creativity. This space feels like the result of everything I learned from my previous setups. The pegboard on the wall holds the items I use every day, along with my DJI drone, making the setup not just functional but also a reflection of my interests, habits, and journey so far."
  }
  
];

export default function MyDeskSetup() {
  const sectionRef = useRef(null);
  const leftBoxRef = useRef(null);
  const rightBoxRef = useRef(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Staggered Intro Animation for both boxes
  useEffect(() => {
    const section = sectionRef.current;
    const leftBox = leftBoxRef.current;
    const rightBox = rightBoxRef.current;
    
    if (!section || !leftBox || !rightBox) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 75%",
        toggleActions: "play none none reverse",
      }
    });

    // Left box slides up and fades in
    tl.fromTo(
      leftBox,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    )
    // Right box follows shortly after
    .fromTo(
      rightBox,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.6"
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === section) t.kill();
      });
    };
  }, []);

  // GSAP Image Crossfade transition
  useEffect(() => {
    imagesRef.current.forEach((img, index) => {
      if (!img) return;
      if (index === currentIndex) {
        gsap.to(img, { opacity: 1, scale: 1, zIndex: 2, duration: 0.6, ease: "power2.out" });
      } else {
        gsap.to(img, { opacity: 0, scale: 1.05, zIndex: 1, duration: 0.6, ease: "power2.out" });
      }
    });
  }, [currentIndex]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % DESK_SETUPS.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? DESK_SETUPS.length - 1 : prev - 1));

  const currentData = DESK_SETUPS[currentIndex];

  return (
    <section id="my-desk-setup" className="mds-section" ref={sectionRef}>
      <div className="mds-inner">
        
        {/* Left Column: Lime Green Title Card */}
        <div className="mds-left-col" ref={leftBoxRef}>
          <div className="mds-title-card">
            <h2 className="mds-main-title">
              My<br />Desk<br />Setup
            </h2>
            <p className="mds-subtitle">Over the years</p>
          </div>
        </div>

        {/* Right Column: Image Slider & Content */}
        <div className="mds-right-col" ref={rightBoxRef}>
          
          {/* Pitch Container carrying the frame logic */}
          <div className="mds-pitch-container">
            {/* Absolute Stacked Images Track */}
            <div className="mds-images-track">
              {DESK_SETUPS.map((setup, i) => (
                <img
                  key={setup.id}
                  ref={(el) => { imagesRef.current[i] = el; }}
                  src={setup.src}
                  alt={`Desk Setup - ${setup.tlTab}`}
                  className="mds-slide-img"
                />
              ))}
            </div>

            {/* The White Frame overlaying the images */}
            <div className="mds-pitch-frame">
              <div className="mds-top-left-tab mds-text-red">
                <span>{currentData.tlTab}</span>
              </div>
              
              <div className="mds-bottom-right-tab mds-text-purple">
                <span>{currentData.brTab}</span>
              </div>
            </div>
          </div>

          {/* Text for Each Image (Title removed) */}
          <div className="mds-text-container">
            <p className="mds-setup-desc">{currentData.description}</p>
          </div>

          {/* Controller (Aligned to the right of the right-column) */}
          <div className="mds-controller">
            <button className="mds-nav-btn" onClick={handlePrev} aria-label="Previous Setup">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button className="mds-nav-btn" onClick={handleNext} aria-label="Next Setup">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

        </div>
      </div>

      <MdsStyles />
    </section>
  );
}

function MdsStyles() {
  return (
    <style>{`
      @font-face {
        font-family: 'CoolveticaMDS';
        src: url('/fonts/Coolvetica Rg.otf') format('opentype');
        font-weight: normal;
        font-style: normal;
      }

      .mds-section {
        width: 100%;
        padding: 5rem 2rem 5rem 2rem;
        background-color: #ffffff;
        font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        box-sizing: border-box;
      }

      .mds-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 4rem;
      }

      /* Left Column */
      .mds-left-col {
        flex: 0 0 300px;
      }

      .mds-title-card {
        background-color: #d1f366; /* Lime green */
        border-radius: 40px;
        padding: 4rem 3rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .mds-main-title {
        font-size: clamp(3.5rem, 5vw, 4.5rem);
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.03em;
        color: #000000;
        margin: 0 0 1rem 0;
      }

      .mds-subtitle {
        font-size: 1.1rem;
        color: #333333;
        margin: 0;
        font-weight: 400;
      }

      /* Right Column */
      .mds-right-col {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .mds-pitch-container {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        background-color: #f5f5f5;
      }

      .mds-images-track {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: 20px;
        overflow: hidden;
      }

      .mds-slide-img {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        object-fit: cover;
        opacity: 0; 
      }

      .mds-pitch-frame {
        position: absolute;
        top: 5%;
        left: 4%;
        right: 4%;
        bottom: 6%;
        border: 16px solid white;
        border-radius: 40px;
        pointer-events: none;
        z-index: 10;
      }

      .mds-top-left-tab {
        position: absolute;
        top: -16px;
        left: -16px;
        background: white;
        font-family: 'CoolveticaMDS', sans-serif;
        font-size: clamp(1.2rem, 2.5vw, 1.8rem);
        padding: 15px 40px 20px 40px;
        border-bottom-right-radius: 30px;
        border-top-left-radius: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.05em;
        pointer-events: auto;
      }

      .mds-top-left-tab::before {
        content: ''; position: absolute; right: -38px; top: 16px; width: 40px; height: 40px;
        background: radial-gradient(circle at 100% 100%, transparent 39px, white 40px);
      }
      .mds-top-left-tab::after {
        content: ''; position: absolute; left: 16px; bottom: -40px; width: 40px; height: 40px;
        background: radial-gradient(circle at 100% 100%, transparent 39px, white 40px);
      }

      .mds-bottom-right-tab {
        position: absolute;
        bottom: -16px;
        right: -16px;
        background: white;
        font-family: 'CoolveticaMDS', sans-serif;
        font-size: clamp(1.3rem, 3vw, 2.2rem);
        padding: 15px 40px 10px 40px;
        border-top-left-radius: 40px;
        border-bottom-right-radius: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.05em;
        pointer-events: auto;
      }

      .mds-bottom-right-tab::before {
        content: ''; position: absolute; left: -35px; bottom: 16px; width: 40px; height: 40px;
        background: radial-gradient(circle at 0% 0%, transparent 39px, white 40px);
      }
      .mds-bottom-right-tab::after {
        content: ''; position: absolute; right: 16px; top: -40px; width: 40px; height: 40px;
        background: radial-gradient(circle at 0% 0%, transparent 39px, white 40px);
      }

      .mds-text-red { color: #ea3e3e; }
      .mds-text-purple { color: #6b63f7; }

      .mds-text-container {
        padding: 0 0.5rem;
        max-width: 800px;
      }

      .mds-setup-desc {
        font-size: 1.05rem;
        line-height: 1.6;
        color: #555;
        margin: 0;
      }

      .mds-controller {
        display: flex;
        align-self: flex-end;
        gap: 0.75rem;
        margin-top: 1rem;
      }

      .mds-nav-btn {
        width: 44px; 
        height: 44px;
        border-radius: 50%;
        border: none;
        background-color: #f5f5f5;
        color: #888;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .mds-nav-btn:hover {
        background-color: #e4e4e4;
        color: #333;
        transform: scale(1.05);
      }

      @media (max-width: 968px) {
        .mds-inner {
          flex-direction: column;
          align-items: center;
          gap: 3rem;
        }

        .mds-left-col {
          flex: none;
          width: 100%;
        }

        .mds-title-card {
          padding: 3rem 2rem;
          border-radius: 30px;
          text-align: center;
        }

        .mds-main-title {
          font-size: 3rem;
          br { display: none; }
        }

        .mds-right-col {
          width: 100%;
        }

        .mds-pitch-container {
          aspect-ratio: auto;
          min-height: 50vh;
        }

        .mds-pitch-frame {
          border-width: 10px;
          border-radius: 20px;
        }

        .mds-top-left-tab {
          top: -10px; left: -10px;
          font-size: 1.2rem;
          padding: 10px 20px 15px 20px;
          border-bottom-right-radius: 20px;
          border-top-left-radius: 20px;
        }

        .mds-top-left-tab::before, .mds-top-left-tab::after { width: 20px; height: 20px; }
        .mds-top-left-tab::before { right: -20px; top: 10px; background: radial-gradient(circle at 100% 100%, transparent 19px, white 20px); }
        .mds-top-left-tab::after { left: 10px; bottom: -20px; background: radial-gradient(circle at 100% 100%, transparent 19px, white 20px); }

        .mds-bottom-right-tab {
          bottom: -10px; right: -10px;
          font-size: 1.5rem;
          padding: 10px 20px 10px 20px;
          border-top-left-radius: 20px;
          border-bottom-right-radius: 20px;
        }

        .mds-bottom-right-tab::before, .mds-bottom-right-tab::after { width: 20px; height: 20px; }
        .mds-bottom-right-tab::before { left: -20px; bottom: 10px; background: radial-gradient(circle at 0% 0%, transparent 19px, white 20px); }
        .mds-bottom-right-tab::after { right: 10px; top: -20px; background: radial-gradient(circle at 0% 0%, transparent 19px, white 20px); }

        .mds-controller {
          align-self: center;
          margin-top: 2rem;
        }
      }
    `}</style>
  );
}