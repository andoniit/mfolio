"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AnimatedIntroText from "./AnimatedIntroText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Solid bento tile colours pulled from the site (AboutMe grid).
// `marker` is chosen to contrast the card background it belongs to.
export const TIMELINE_PALETTE = [
  { bg: "#ef3e3e", text: "#ffffff", sub: "rgba(255,255,255,0.82)", chip: "rgba(255,255,255,0.16)", marker: "#dff952" }, // red → lime
  { bg: "#7066f5", text: "#ffffff", sub: "rgba(255,255,255,0.82)", chip: "rgba(255,255,255,0.16)", marker: "#d4f54c" }, // purple → lime
  { bg: "#6c5ce7", text: "#ffffff", sub: "rgba(255,255,255,0.82)", chip: "rgba(255,255,255,0.16)", marker: "#ffd23f" }, // indigo → yellow
  { bg: "#dff952", text: "#141414", sub: "rgba(20,20,20,0.7)", chip: "rgba(0,0,0,0.08)", marker: "#7066f5" }, // lime → purple
  { bg: "#343434", text: "#ffffff", sub: "rgba(255,255,255,0.78)", chip: "rgba(255,255,255,0.14)", marker: "#dff952" }, // dark → lime
];

// Bold marker shapes echoing the reference roadmap (dot / diamond / ticket / star).
const MARKER_SHAPES = ["dot", "diamond", "ticket", "star"];

// Distinctive "colorful shapes" used as floating decoration in the side gutters:
// a flower/cloud, a pinched cushion square, and a four-point star.
const CUSHION_PATH =
  "M-70,-42 C-70,-60 -60,-70 -42,-70 C-16,-54 16,-54 42,-70 C60,-70 70,-60 70,-42 C54,-16 54,16 70,42 C70,60 60,70 42,70 C16,54 -16,54 -42,70 C-60,70 -70,60 -70,42 C-54,16 -54,-16 -70,-42 Z";
const STAR4_PATH = "M0,-95 Q22,-22 95,0 Q22,22 0,95 Q-22,22 -95,0 Q-22,-22 0,-95 Z";
const FLOWER_PETALS = [
  [46, 0],
  [23, 39.8],
  [-23, 39.8],
  [-46, 0],
  [-23, -39.8],
  [23, -39.8],
];
const FLOAT_SHAPES = ["flower", "cushion", "star4"];
const FLOAT_COLORS = ["#3B82F6", "#ffd23f", "#22C55E", "#7066f5", "#ef3e3e"];

function MarkerShape({ shape, color }) {
  const common = { width: 42, height: 42, viewBox: "0 0 24 24", "aria-hidden": true };
  if (shape === "diamond") {
    return (
      <svg {...common}>
        <path d="M12 2l10 10-10 10L2 12z" fill={color} />
      </svg>
    );
  }
  if (shape === "ticket") {
    return (
      <svg {...common}>
        <path
          d="M4 7h16a0 0 0 010 0v3a2 2 0 000 4v3a0 0 0 010 0H4a0 0 0 010 0v-3a2 2 0 000-4V7a0 0 0 010 0z"
          fill={color}
        />
      </svg>
    );
  }
  if (shape === "star") {
    return (
      <svg {...common}>
        <path
          d="M12 2l2.5 5.5L20 8.5l-4 4 1 5.5-5-2.8L7 18l1-5.5-4-4 5.5-1z"
          fill={color}
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" fill={color} />
    </svg>
  );
}

function FloatShape({ index, size }) {
  const type = FLOAT_SHAPES[index % FLOAT_SHAPES.length];
  const color = FLOAT_COLORS[index % FLOAT_COLORS.length];
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" aria-hidden="true">
      {type === "flower" ? (
        <g fill={color}>
          {FLOWER_PETALS.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="42" />
          ))}
          <circle cx="0" cy="0" r="50" />
        </g>
      ) : (
        <path d={type === "cushion" ? CUSHION_PATH : STAR4_PATH} fill={color} />
      )}
    </svg>
  );
}

// Multi-spoke sparkle / asterisk (the blue shape from the reference).
function AsteriskShape({ color, size, spokes = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {Array.from({ length: spokes }).map((_, i) => (
        <rect
          key={i}
          x="45.5"
          y="5"
          width="9"
          height="90"
          rx="4.5"
          fill={color}
          transform={`rotate(${(360 / spokes) * i} 50 50)`}
        />
      ))}
    </svg>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Smooth weaving path (vertical S-curves) through the measured marker centres. */
function buildPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const midY = (prev.y + cur.y) / 2;
    d += ` C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.y}`;
  }
  return d;
}

export default function TimelineSection({
  id,
  title,
  bigTitle = false,
  eyebrow,
  subtitle,
  items = [],
  variant = "timeline",
}) {
  const isGrid = variant === "grid";
  const sectionRef = useRef(null);
  const listRef = useRef(null);
  const basePathRef = useRef(null);
  const redPathRef = useRef(null);
  const aster1Ref = useRef(null);
  const aster2Ref = useRef(null);
  const [pathD, setPathD] = useState("");
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [openSet, setOpenSet] = useState(() => new Set());

  const toggleOpen = (index) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Measure marker centres → build the connector path (rAF-debounced).
  useEffect(() => {
    if (!items.length || isGrid) return;
    const list = listRef.current;
    if (!list) return;

    let pending = false;
    const measure = () => {
      pending = false;
      const listRect = list.getBoundingClientRect();
      const markers = list.querySelectorAll(".tl-marker");
      const points = [];
      markers.forEach((m) => {
        const r = m.getBoundingClientRect();
        points.push({
          x: r.left - listRect.left + r.width / 2,
          y: r.top - listRect.top + r.height / 2,
        });
      });
      setDims({ w: list.clientWidth, h: list.scrollHeight });
      setPathD(buildPath(points));
      ScrollTrigger.refresh();
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(measure);
    };

    schedule();

    const ro = new ResizeObserver(schedule);
    ro.observe(list);
    window.addEventListener("resize", schedule);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [items, isGrid]);

  // Card + marker reveal on scroll.
  useEffect(() => {
    if (!items.length) return;

    const ctx = gsap.context(() => {
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

      gsap.utils.toArray(".tl-item").forEach((el) => {
        const fromLeft = el.classList.contains("left");
        const card = el.querySelector(".tl-card");
        const marker = el.querySelector(".tl-marker");
        const trig = { trigger: el, start: "top 85%", toggleActions: "play none none reverse" };

        gsap.from(card, {
          opacity: 0,
          y: reduced ? 14 : isGrid ? 44 : 34,
          x: reduced || isMobile || isGrid ? 0 : fromLeft ? -48 : 48,
          scale: reduced ? 1 : 0.96,
          duration: reduced ? 0.4 : 0.75,
          ease: "back.out(1.1)",
          scrollTrigger: trig,
        });
        if (marker) {
          gsap.from(marker, {
            scale: 0,
            duration: reduced ? 0.3 : 0.5,
            ease: "back.out(2.2)",
            scrollTrigger: trig,
          });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [items, isGrid]);

  // Draw the red connector path as the section scrolls.
  useEffect(() => {
    const red = redPathRef.current;
    if (!pathD || !red) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const len = red.getTotalLength();
    gsap.set(red, { strokeDasharray: len, strokeDashoffset: reduced ? 0 : len });

    let st;
    if (!reduced) {
      st = ScrollTrigger.create({
        trigger: listRef.current,
        start: "top 68%",
        end: "bottom 78%",
        scrub: 0.5,
        onUpdate: (self) => {
          gsap.set(red, { strokeDashoffset: len * (1 - self.progress) });
        },
      });
    }
    ScrollTrigger.refresh();

    return () => {
      if (st) st.kill();
    };
  }, [pathD]);

  // Rotate the sparkle shapes on scroll.
  useEffect(() => {
    if (!items.length) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const tweens = [];
    const spin = (el, amount) => {
      if (!el) return;
      tweens.push(
        gsap.to(el, {
          rotate: amount,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        })
      );
    };
    spin(aster1Ref.current, 320);
    spin(aster2Ref.current, -420);

    return () => tweens.forEach((t) => t.scrollTrigger?.kill() || t.kill());
  }, [items]);

  if (!items.length) return null;

  return (
    <section ref={sectionRef} id={id} className="tl-section" aria-label={title}>
      <span ref={aster1Ref} className="tl-aster tl-aster-1" aria-hidden="true">
        <AsteriskShape color="#3B82F6" size={104} />
      </span>
      <span ref={aster2Ref} className="tl-aster tl-aster-2" aria-hidden="true">
        <AsteriskShape color="#7066f5" size={84} />
      </span>

      <div className="tl-wrapper">
        <header className={`tl-header ${bigTitle ? "is-big" : "is-secondary"}`}>
          {eyebrow ? <span className="tl-eyebrow">{eyebrow}</span> : null}
          {bigTitle ? (
            <h2 className="tl-title-big">
              <AnimatedIntroText text={title} />
            </h2>
          ) : (
            <h2 className="tl-title">{title}</h2>
          )}
          {subtitle ? <p className="tl-subtitle">{subtitle}</p> : null}
        </header>

        <div className={`tl-list ${isGrid ? "grid" : "timeline"}`} ref={listRef}>
          {!isGrid ? (
            <svg
              className="tl-svg"
              width={dims.w || 0}
              height={dims.h || 0}
              viewBox={`0 0 ${dims.w || 0} ${dims.h || 0}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                ref={basePathRef}
                d={pathD}
                fill="none"
                stroke="rgba(17,17,17,0.09)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                ref={redPathRef}
                d={pathD}
                fill="none"
                stroke="#ef3e3e"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : null}

          {items.map((item, index) => {
            const color = TIMELINE_PALETTE[index % TIMELINE_PALETTE.length];
            const markerShape = MARKER_SHAPES[index % MARKER_SHAPES.length];
            const side = index % 2 === 0 ? "left" : "right";
            const meta = [item.location, item.type].filter(Boolean).join(" · ");
            const hasBullets = Array.isArray(item.bullets) && item.bullets.length > 0;
            const hasSkills = Array.isArray(item.skills) && item.skills.length > 0;
            const hasDetails = Boolean(item.description) || hasBullets || hasSkills;
            const isOpen = openSet.has(index);

            return (
              <div
                key={item.id || index}
                className={`tl-item ${isGrid ? "grid-item" : side}`}
                style={{
                  "--bg": color.bg,
                  "--text": color.text,
                  "--sub": color.sub,
                  "--chip": color.chip,
                }}
              >
                <span className="tl-float" aria-hidden="true">
                  <FloatShape index={index} size={index % 2 === 0 ? 150 : 120} />
                </span>

                <span className="tl-marker">
                  <MarkerShape shape={markerShape} color={color.marker} />
                </span>

                <div className="tl-card">
                  {item.dateLabel ? <p className="tl-date">{item.dateLabel}</p> : null}
                  <h3 className="tl-role">{item.role}</h3>
                  {item.company ? (
                    <p className="tl-company">
                      {item.companyUrl ? (
                        <a href={item.companyUrl} target="_blank" rel="noopener noreferrer">
                          {item.company}
                        </a>
                      ) : (
                        item.company
                      )}
                    </p>
                  ) : null}
                  {meta ? <p className="tl-meta">{meta}</p> : null}

                  {hasDetails ? (
                    <>
                      <button
                        type="button"
                        className={`tl-toggle ${isOpen ? "open" : ""}`}
                        aria-expanded={isOpen}
                        onClick={() => toggleOpen(index)}
                      >
                        {isOpen ? "Hide details" : "View details"}
                        <span className="tl-chevron">
                          <Chevron />
                        </span>
                      </button>

                      <div className={`tl-details ${isOpen ? "open" : ""}`}>
                        <div className="tl-details-inner">
                          {item.description ? (
                            <p className="tl-desc">{item.description}</p>
                          ) : null}

                          {hasBullets ? (
                            <ul className="tl-bullets">
                              {item.bullets.map((b, bi) => (
                                <li key={bi}>{b}</li>
                              ))}
                            </ul>
                          ) : null}

                          {hasSkills ? (
                            <div className="tl-chips">
                              {item.skills.map((s, si) => (
                                <span className="tl-chip" key={si}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .tl-section {
          position: relative;
          width: 100%;
          padding: 6rem 0 7rem;
          box-sizing: border-box;
          overflow: hidden;
        }
        .tl-wrapper {
          position: relative;
          z-index: 1;
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Scroll-rotating sparkle shapes in the whitespace */
        .tl-aster {
          position: absolute;
          z-index: 0;
          line-height: 0;
          pointer-events: none;
          will-change: transform;
        }
        .tl-aster-1 {
          top: 14%;
          left: 4%;
        }
        .tl-aster-2 {
          bottom: 12%;
          right: 4.5%;
        }

        /* Header */
        .tl-header {
          text-align: center;
          margin-bottom: 3.5rem;
        }
        .tl-eyebrow {
          display: inline-block;
          font-family: 'Coolvetica', sans-serif;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 0.8rem;
          color: #8a8a8a;
          margin-bottom: 0.6rem;
        }
        .tl-title-big {
          margin: 0;
          font-family: 'Coolvetica', sans-serif;
          letter-spacing: 0.05em;
          font-size: 6em;
          line-height: 1;
          color: #111;
        }
        .tl-title {
          margin: 0;
          font-family: 'Coolvetica', sans-serif;
          letter-spacing: 0.04em;
          font-size: 2.6rem;
          font-weight: 600;
          color: #111;
        }
        .tl-subtitle {
          margin: 0.7rem auto 0;
          max-width: 480px;
          font-size: 0.98rem;
          line-height: 1.55;
          color: #6b7280;
        }

        /* Timeline list + connector path */
        .tl-list {
          position: relative;
        }
        .tl-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .tl-item {
          position: relative;
          width: 100%;
          margin-bottom: 3rem;
          z-index: 1;
        }
        .tl-item:last-child {
          margin-bottom: 0;
        }

        .tl-marker {
          position: absolute;
          top: 26px;
          transform: translate(-50%, -50%);
          z-index: 3;
          display: inline-flex;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.18));
        }
        .tl-item.left .tl-marker {
          left: 42%;
        }
        .tl-item.right .tl-marker {
          left: 58%;
        }

        .tl-card {
          position: relative;
          z-index: 1;
          width: 40%;
          box-sizing: border-box;
          background: var(--bg);
          color: var(--text);
          border-radius: 24px;
          padding: 1.5rem 1.7rem 1.65rem;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.12);
          font-family: var(--font-satoshi), 'Coolvetica', ui-sans-serif, system-ui, sans-serif;
        }
        .tl-item.left .tl-card {
          margin-right: auto;
        }
        .tl-item.right .tl-card {
          margin-left: auto;
        }

        /* ---- Grid variant (Voluntary Roles): staggered card deck, no rail ---- */
        .tl-list.grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2.25rem 2.5rem;
          align-items: start;
        }
        .tl-list.grid .tl-item {
          width: 100%;
          margin: 0;
        }
        /* Offset the right column for a staggered, non-timeline rhythm */
        .tl-list.grid .tl-item:nth-child(even) {
          margin-top: 3.5rem;
        }
        .tl-list.grid .tl-card {
          width: 100%;
        }
        /* Marker shape becomes a badge sitting on the card corner */
        .tl-list.grid .tl-marker {
          top: -16px;
          left: auto;
          right: 18px;
          transform: none;
        }
        /* Colorful shape peeks from behind the opposite corner */
        .tl-list.grid .tl-float {
          top: auto;
          right: auto;
          bottom: -34px;
          left: -34px;
          transform: none;
          animation-name: tlFloatGrid;
        }
        .tl-list.grid .tl-item:nth-child(even) .tl-float {
          left: auto;
          right: -34px;
        }
        @keyframes tlFloatGrid {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(-8deg);
          }
        }

        .tl-date {
          margin: 0 0 0.5rem;
          font-family: 'Coolvetica', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: 0.01em;
          color: var(--text);
        }
        .tl-role {
          margin: 0;
          font-size: 1.12rem;
          font-weight: 700;
          line-height: 1.2;
          color: var(--text);
        }
        .tl-company {
          margin: 0.2rem 0 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--sub);
        }
        .tl-company a {
          color: inherit;
          text-decoration: none;
        }
        .tl-company a:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .tl-meta {
          margin: 0.3rem 0 0;
          font-size: 0.8rem;
          color: var(--sub);
          letter-spacing: 0.01em;
        }
        .tl-desc {
          margin: 1rem 0 0;
          font-size: 0.92rem;
          line-height: 1.6;
          color: var(--sub);
        }
        .tl-bullets {
          margin: 1rem 0 0;
          padding-left: 18px;
        }
        .tl-bullets li {
          margin-bottom: 7px;
          font-size: 0.86rem;
          line-height: 1.5;
          color: var(--sub);
        }
        .tl-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 1.05rem;
        }
        .tl-chip {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text);
          background: var(--chip);
          padding: 4px 10px;
          border-radius: 999px;
        }

        /* Dropdown toggle + collapsible details */
        .tl-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 1rem;
          padding: 0;
          background: none;
          border: none;
          cursor: pointer;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--text);
          opacity: 0.92;
        }
        .tl-toggle:hover {
          opacity: 1;
        }
        .tl-chevron {
          display: inline-flex;
          transition: transform 0.3s ease;
        }
        .tl-toggle.open .tl-chevron {
          transform: rotate(180deg);
        }
        .tl-details {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.38s ease;
        }
        .tl-details.open {
          grid-template-rows: 1fr;
        }
        .tl-details-inner {
          overflow: hidden;
          min-height: 0;
        }

        /* Floating organic shapes in the side whitespace */
        .tl-float {
          position: absolute;
          top: 50%;
          z-index: 0;
          pointer-events: none;
          line-height: 0;
          opacity: 0.9;
          animation: tlFloat 9s ease-in-out infinite;
        }
        .tl-item.left .tl-float {
          right: 9%;
          transform: translateY(-50%);
          animation-duration: 10s;
        }
        .tl-item.right .tl-float {
          left: 9%;
          transform: translateY(-50%);
          animation-duration: 8s;
        }
        .tl-item:nth-child(odd) .tl-float {
          animation-delay: -2.5s;
        }
        @keyframes tlFloat {
          0%,
          100% {
            transform: translateY(-50%) rotate(0deg);
          }
          50% {
            transform: translateY(calc(-50% - 18px)) rotate(8deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tl-float {
            animation: none;
          }
        }

        /* Mobile: single left rail */
        @media (max-width: 768px) {
          .tl-section {
            padding: 4rem 0 5rem;
          }
          .tl-wrapper {
            padding: 0 1.25rem;
          }
          .tl-header {
            margin-bottom: 2.5rem;
          }
          .tl-title-big {
            font-size: 3.4rem;
          }
          .tl-title {
            font-size: 2.1rem;
          }
          .tl-item.left .tl-marker,
          .tl-item.right .tl-marker {
            left: 18px;
          }
          .tl-item .tl-card,
          .tl-item.left .tl-card,
          .tl-item.right .tl-card {
            width: 100%;
            margin: 0;
            padding-left: 1.5rem;
          }
          .tl-item {
            padding-left: 42px;
          }
          .tl-date {
            font-size: 1.5rem;
          }
          .tl-float {
            display: none;
          }
          /* Grid variant → single column on mobile, no rail padding */
          .tl-list.grid {
            grid-template-columns: 1fr;
            gap: 1.75rem;
          }
          .tl-list.grid .tl-item,
          .tl-list.grid .tl-item:nth-child(even) {
            padding-left: 0;
            margin-top: 0;
          }
          .tl-list.grid .tl-card {
            padding-left: 1.7rem;
          }
          .tl-aster {
            opacity: 0.4;
          }
          .tl-aster-1 {
            top: 4%;
            left: -4%;
          }
          .tl-aster-2 {
            bottom: 3%;
            right: -4%;
          }
        }
      `}</style>
    </section>
  );
}
