"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import gsap from "gsap";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { GlassPill } from "@/lib/glass-pill";
import type { LiquidGlassHandle } from "@/lib/liquid-glass";
import styles from "./FloatingBottomNav.module.scss";

const SNAP_THRESHOLD_PX = 70;
const SNAP_ZONE_PAD_PX = 14;

/** Burger ring: radius in SVG user units (viewBox 0 0 56 56, center 28). */
const MENU_PROGRESS_RING_R = 23;
const MENU_PROGRESS_CIRCUMFERENCE = 2 * Math.PI * MENU_PROGRESS_RING_R;

function clampn(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** WCAG relative luminance for sRGB 0–255 channels. */
function relLuminance255(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function parseCssBackgroundRgba(
  css: string
): { r: number; g: number; b: number; a: number } | null {
  const t = css.trim().toLowerCase();
  if (
    t === "transparent" ||
    t === "rgba(0, 0, 0, 0)" ||
    t === "rgba(0,0,0,0)" ||
    t === ""
  ) {
    return null;
  }
  const m = t.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  const a = m[4] !== undefined ? Number(m[4]) : 1;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a };
}

/** Approximate page luminance behind the glass (skip the pill in the hit-test stack). */
function samplePageLuminanceBehindPill(pill: HTMLElement): number | null {
  const r = pill.getBoundingClientRect();
  const cx = clampn(r.left + r.width * 0.36, r.left + 14, r.right - 18);
  const cy = clampn(r.top + r.height * 0.5, r.top + 2, r.bottom - 2);
  const stack = document.elementsFromPoint(cx, cy);
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    if (el === pill || pill.contains(el)) continue;
    const st = getComputedStyle(el as HTMLElement);
    const parsed = parseCssBackgroundRgba(st.backgroundColor);
    if (!parsed || parsed.a < 0.04) continue;
    const { r: R, g: G, b: B, a: A } = parsed;
    const Rb = R * A + 255 * (1 - A);
    const Gb = G * A + 255 * (1 - A);
    const Bb = B * A + 255 * (1 - A);
    return relLuminance255(Rb, Gb, Bb);
  }
  return null;
}

function useWindowSize() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const read = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener("resize", read, { passive: true });
    return () => window.removeEventListener("resize", read);
  }, []);
  return size;
}

const HOME_SECTIONS = [
  {
    id: "hero-section",
    label: "Hello welcome to my portfolio - Anirudha Kapileshwari - Andon",
  },
  { id: "about-me", label: "About Me" },
  { id: "experience", label: "Experience" },
  { id: "my-vision", label: "My Vision" },
  { id: "featured-projects", label: "Featured Projects" },
  { id: "my-desk-setup", label: "My Desk Setup" },
  { id: "outside-of-work", label: "Outside of Work" },
  { id: "recommendations", label: "Recommendations" },
] as const;

type HomeSectionLabel = (typeof HOME_SECTIONS)[number]["label"];

const prettifySegment = (segment: string) =>
  decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getLocationLabel = (pathname: string) => {
  if (pathname === "/") return "Home";

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Home";

  const [first, second] = segments;

  if (first === "projects") {
    return second ? `Projects / ${prettifySegment(second)}` : "Projects";
  }

  if (first === "blog") {
    return second ? `Blog / ${prettifySegment(second)}` : "Blog";
  }

  if (first === "category") {
    return second ? `Category / ${prettifySegment(second)}` : "Category";
  }

  if (first === "tag") {
    return second ? `Tag / ${prettifySegment(second)}` : "Tag";
  }

  return segments.map(prettifySegment).join(" / ");
};

export default function FloatingBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const flipResetRef = useRef<number | null>(null);
  const pillRef = useRef<HTMLElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const snapZoneRef = useRef<HTMLDivElement>(null);
  const glassPillRef = useRef<GlassPill | null>(null);
  const { w: winW, h: winH } = useWindowSize();
  const [snapBox, setSnapBox] = useState({ w: 360, h: 52 });
  const [isDesktop, setIsDesktop] = useState(false);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const [marqueeDuration, setMarqueeDuration] = useState(14);
  const [isNearFooter, setIsNearFooter] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHomeLabel, setActiveHomeLabel] = useState<HomeSectionLabel>(
    HOME_SECTIONS[0].label
  );
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward">(
    "forward"
  );
  const [previousLabel, setPreviousLabel] = useState<HomeSectionLabel | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [navIntroReady, setNavIntroReady] = useState(false);
  const [labelLightOnDarkBg, setLabelLightOnDarkBg] = useState(false);
  const labelContrastBucketRef = useRef<"light" | "dark" | null>(null);

  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scrollRingDashoffset = useTransform(
    scrollYProgress,
    [0, 1],
    [MENU_PROGRESS_CIRCUMFERENCE, 0]
  );

  const locationLabel = useMemo(
    () => (pathname === "/" ? activeHomeLabel : getLocationLabel(pathname || "/")),
    [activeHomeLabel, pathname]
  );
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const pillExpandedWidthPx = useMemo(() => {
    if (winW <= 0) return 360;
    return winW < 769 ? Math.min(winW * 0.88, 320) : Math.min(winW * 0.3, 360);
  }, [winW]);

  const pillCollapsedWidthPx = useMemo(() => {
    const base = winW < 769 ? 90 : 94;
    if (winW <= 0) return base;
    return Math.min(base, pillExpandedWidthPx);
  }, [winW, pillExpandedWidthPx]);

  useEffect(() => {
    if (navIntroReady) return;
    if (prefersReducedMotion) {
      setNavIntroReady(true);
      return;
    }
    if (!pathname || pathname.startsWith("/admin") || pathname === "/andon-copilot") {
      return;
    }
    if (pathname !== "/") {
      const id = requestAnimationFrame(() => setNavIntroReady(true));
      return () => cancelAnimationFrame(id);
    }
    const onPreloaderExited = () => setNavIntroReady(true);
    window.addEventListener("mf:preloader-exited", onPreloaderExited);
    const fallback = window.setTimeout(onPreloaderExited, 3600);
    return () => {
      window.removeEventListener("mf:preloader-exited", onPreloaderExited);
      window.clearTimeout(fallback);
    };
  }, [pathname, navIntroReady, prefersReducedMotion]);

  useEffect(() => {
    if (!navIntroReady) return;
    const t = window.setTimeout(() => {
      glassPillRef.current?.refresh();
    }, 800);
    return () => window.clearTimeout(t);
  }, [navIntroReady]);

  useEffect(() => {
    if (!navIntroReady || isNearFooter) return;
    const pill = pillRef.current;
    if (!pill) return;

    let raf = 0;
    const tick = () => {
      const el = pillRef.current;
      if (!el) return;
      const L = samplePageLuminanceBehindPill(el);
      if (L === null) return;
      const prev = labelContrastBucketRef.current;
      let next: "light" | "dark";
      if (L < 0.34) next = "light";
      else if (L > 0.5) next = "dark";
      else if (prev === "light" || prev === "dark") next = prev;
      else next = L < 0.42 ? "light" : "dark";

      if (next !== prev) {
        labelContrastBucketRef.current = next;
        setLabelLightOnDarkBg(next === "light");
      }
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("pointerup", schedule, true);
    const ro = new ResizeObserver(schedule);
    ro.observe(pill);
    const iv = window.setInterval(schedule, 900);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("pointerup", schedule, true);
      ro.disconnect();
      window.clearInterval(iv);
    };
  }, [navIntroReady, isNearFooter, pathname, locationLabel, winW, winH]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) {
      return;
    }

    const footer = document.querySelector('[data-site-footer="true"]');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearFooter(entry.intersectionRatio >= 0.3);
      },
      {
        threshold: [0, 0.3, 1],
      }
    );

    observer.observe(footer);

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!isNearFooter) return;
    const pill = pillRef.current;
    if (!pill || typeof window === "undefined") return;
    // Send it home on the spring rather than tweening transform directly, which
    // would fight the controller's own loop for the same property.
    glassPillRef.current?.home();
  }, [isNearFooter]);

  useEffect(() => {
    if (pathname !== "/") {
      setActiveHomeLabel(HOME_SECTIONS[0].label);
      setPreviousLabel(null);
      setIsFlipping(false);
      return;
    }

    let ticking = false;

    const updateActiveSection = () => {
      const viewportCenter = window.innerHeight * 0.45;
      let nextIndex = 0;
      let maxScore = -1;

      HOME_SECTIONS.forEach((homeSection, index) => {
        const section = document.getElementById(homeSection.id);
        if (!section) return;

        const rect = section.getBoundingClientRect();
        
        // 1. Check if the section spans across the viewport center
        const isCenterInside = rect.top <= viewportCenter && rect.bottom >= viewportCenter;
        
        // 2. Calculate how much of this section is currently visible on screen
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(window.innerHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        
        // Calculate a score for this section
        let score = visibleHeight;
        
        // Give a massive score boost to the section covering the center of the screen
        if (isCenterInside) {
          score += window.innerHeight * 10; 
        }

        if (score > maxScore) {
          maxScore = score;
          nextIndex = index;
        }
      });

      const nextLabel = HOME_SECTIONS[nextIndex]?.label ?? HOME_SECTIONS[0].label;

      setActiveHomeLabel((currentLabel) => {
        if (currentLabel === nextLabel) {
          return currentLabel;
        }

        const currentIndex = HOME_SECTIONS.findIndex(
          (section) => section.label === currentLabel
        );

        setFlipDirection(nextIndex > currentIndex ? "forward" : "backward");
        setPreviousLabel(currentLabel);
        setIsFlipping(true);

        if (flipResetRef.current) {
          window.clearTimeout(flipResetRef.current);
        }

        flipResetRef.current = window.setTimeout(() => {
          setPreviousLabel(null);
          setIsFlipping(false);
          flipResetRef.current = null;
        }, 420);

        return nextLabel;
      });
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        updateActiveSection();
        ticking = false;
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (flipResetRef.current) {
        window.clearTimeout(flipResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!viewportRef.current || !measureRef.current) return;

    const measure = () => {
      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      const textWidth = measureRef.current?.scrollWidth ?? 0;
      const overflowing = textWidth > viewportWidth + 8;

      setShouldMarquee(overflowing);

      if (overflowing) {
        setMarqueeDuration(Math.max(7, textWidth / 42));
      }
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewportRef.current);
    resizeObserver.observe(measureRef.current);

    return () => resizeObserver.disconnect();
  }, [locationLabel]);

  useLayoutEffect(() => {
    if (!isDesktop) return;
    const pill = pillRef.current;
    if (!pill || typeof window === "undefined") return;
    const r = pill.getBoundingClientRect();
    setSnapBox({
      w: Math.ceil(r.width) + SNAP_ZONE_PAD_PX * 2,
      h: Math.ceil(r.height) + SNAP_ZONE_PAD_PX * 2,
    });
  }, [isDesktop, locationLabel, shouldMarquee, winW, winH, isMobileMenuOpen, navIntroReady]);

  useLayoutEffect(() => {
    if (!isDesktop) return;
    void requestAnimationFrame(() => glassPillRef.current?.refresh());
  }, [isDesktop, snapBox.w, snapBox.h]);

  // Liquid glass on the pill: a real refraction bulge at the rim plus a faint
  // chromatic fringe. The module owns `backdrop-filter` and rebuilds its
  // displacement map on resize (the intro width animation, hover padding); the
  // tint, inner highlights and shadow stay in the stylesheet. Chromium only —
  // Safari/Firefox get the frosted-blur fallback automatically, so nothing here
  // is load-bearing for legibility.
  useEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;

    let glass: LiquidGlassHandle | null = null;
    let cancelled = false;

    void import("@/lib/liquid-glass.js").then(() => {
      if (cancelled || !window.liquidGlass) return;
      glass = window.liquidGlass(pill, {
        // The pill is small and carries text, so: gentle bulge, wide neutral
        // interior, and enough interior blur to keep the label crisp.
        scale: -70,
        chroma: 4,
        border: 0.16,
        mapBlur: 8,
        blur: 6,
        saturate: 1.7,
        fallbackBlur: 20,
      });
    });

    return () => {
      cancelled = true;
      glass?.destroy();
    };
  }, []);

  // Drag physics: the pill chases the pointer on a spring, squashes along its
  // direction of travel, and springs home when dropped near its resting spot.
  // Pointer position is published as --gx/--gy so the glare tracks the cursor.
  useEffect(() => {
    const pill = pillRef.current;
    const handle = dragHandleRef.current;
    const snapZone = snapZoneRef.current;

    if (!isDesktop || !pill || !handle || typeof window === "undefined") {
      glassPillRef.current?.destroy();
      glassPillRef.current = null;
      return;
    }

    if (snapZone) gsap.set(snapZone, { opacity: 0, scale: 0.96 });

    const controller = new GlassPill(pill, {
      handle,
      margin: 10,
      snapThreshold: SNAP_THRESHOLD_PX,
      reducedMotion: !!prefersReducedMotion,
      onDragState({ dragging, nearHome }) {
        gsap.set(handle, { cursor: dragging ? "grabbing" : "grab" });
        if (!snapZone) return;
        const show = dragging && nearHome;
        gsap.to(snapZone, {
          opacity: show ? 1 : 0,
          scale: show ? 1 : 0.96,
          duration: 0.2,
          ease: "power2.out",
        });
      },
    });

    glassPillRef.current = controller;

    return () => {
      controller.destroy();
      glassPillRef.current = null;
    };
  }, [isDesktop, pathname, winW, winH, prefersReducedMotion]);

  /** Portfolio preview iframe (`/?mfEmbed=1`) — hide floating nav so it is not duplicated. */
  if (searchParams.get("mfEmbed") === "1") {
    return null;
  }

  if (!pathname || pathname.startsWith("/admin") || pathname === "/andon-copilot") {
    return null;
  }

  return (
    <div
      className={`${styles.wrapper} ${isNearFooter ? styles.hidden : ""}`}
      aria-hidden={isNearFooter}
    >
      {isDesktop ? (
        <div className={styles.snapZoneWrap} aria-hidden>
          <div
            ref={snapZoneRef}
            className={styles.snapZone}
            style={{ width: snapBox.w, height: snapBox.h }}
          />
        </div>
      ) : null}

      <motion.nav
        ref={pillRef}
        data-label-contrast={labelLightOnDarkBg ? "light" : "dark"}
        className={`${styles.pill} ${
          !navIntroReady && !prefersReducedMotion ? styles.pillIntroCollapsed : ""
        }`}
        aria-label="Floating site navigation"
        initial={false}
        animate={{
          width:
            prefersReducedMotion || navIntroReady
              ? pillExpandedWidthPx
              : pillCollapsedWidthPx,
        }}
        transition={{
          duration: prefersReducedMotion ? 0.01 : 0.72,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div
          id="floating-bottom-nav-mobile-menu"
          className={`${styles.mobileMenuPanel} ${
            isMobileMenuOpen ? styles.mobileMenuPanelOpen : ""
          }`}
        >
          <Link href="/" className={styles.mobileMenuLink} onClick={closeMobileMenu}>
            Home
          </Link>
          <Link href="/projects" className={styles.mobileMenuLink} onClick={closeMobileMenu}>
            Projects
          </Link>
          <Link href="/blog" className={styles.mobileMenuLink} onClick={closeMobileMenu}>
            Blog
          </Link>
        </div>

        <div
          ref={dragHandleRef}
          className={`${styles.locationSection} ${isDesktop ? styles.dragHandle : ""}`}
        >
          <div className={styles.locationViewport} ref={viewportRef}>
            {pathname === "/" && shouldMarquee ? (
              <div
                className={styles.locationTrack}
                style={
                  {
                    "--location-scroll-duration": `${marqueeDuration}s`,
                  } as CSSProperties
                }
              >
                <span>{locationLabel}</span>
                <span aria-hidden="true">{locationLabel}</span>
              </div>
            ) : pathname === "/" ? (
              <div className={styles.locationFlipStage}>
                {previousLabel ? (
                  <span
                    key={`prev-${previousLabel}-${flipDirection}`}
                    className={`${styles.locationFlipLabel} ${
                      flipDirection === "forward"
                        ? styles.locationFlipOutForward
                        : styles.locationFlipOutBackward
                    }`}
                    aria-hidden="true"
                  >
                    {previousLabel}
                  </span>
                ) : null}
                <span
                  key={`current-${locationLabel}-${flipDirection}`}
                  className={`${styles.locationFlipLabel} ${
                    isFlipping
                      ? flipDirection === "forward"
                        ? styles.locationFlipInForward
                        : styles.locationFlipInBackward
                      : styles.locationFlipStatic
                  }`}
                >
                  {locationLabel}
                </span>
              </div>
            ) : shouldMarquee ? (
              <div
                className={styles.locationTrack}
                style={
                  {
                    "--location-scroll-duration": `${marqueeDuration}s`,
                  } as CSSProperties
                }
              >
                <span>{locationLabel}</span>
                <span aria-hidden="true">{locationLabel}</span>
              </div>
            ) : (
              <span className={styles.locationText}>
                {locationLabel}
              </span>
            )}

            <span ref={measureRef} className={styles.measureText} aria-hidden="true">
              {locationLabel}
            </span>
          </div>
        </div>

        <span className={styles.divider} aria-hidden="true" />

        <div className={styles.mobileMenu}>
          <div className={styles.menuButtonWrap}>
            <svg
              className={styles.scrollProgressRing}
              viewBox="0 0 56 56"
              width="56"
              height="56"
              aria-hidden
            >
              <circle
                className={styles.scrollProgressTrack}
                cx="28"
                cy="28"
                r={MENU_PROGRESS_RING_R}
                fill="none"
              />
              <motion.circle
                className={styles.scrollProgressFill}
                cx="28"
                cy="28"
                r={MENU_PROGRESS_RING_R}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={MENU_PROGRESS_CIRCUMFERENCE}
                style={{ strokeDashoffset: scrollRingDashoffset }}
                transform="rotate(-90 28 28)"
              />
            </svg>
            <button
              type="button"
              className={`${styles.menuButton} ${isMobileMenuOpen ? styles.menuButtonActive : ""}`}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="floating-bottom-nav-mobile-menu"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
