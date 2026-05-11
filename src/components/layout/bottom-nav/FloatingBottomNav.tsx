"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import gsap from "gsap";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import styles from "./FloatingBottomNav.module.scss";

const SNAP_THRESHOLD_PX = 70;
const SNAP_ZONE_PAD_PX = 14;

/** Burger ring: radius in SVG user units (viewBox 0 0 56 56, center 28). */
const MENU_PROGRESS_RING_R = 23;
const MENU_PROGRESS_CIRCUMFERENCE = 2 * Math.PI * MENU_PROGRESS_RING_R;

type DraggableInst = {
  kill: () => void;
  update: () => void;
  x: number;
  y: number;
  applyBounds: (b: { minX: number; maxX: number; minY: number; maxY: number }) => void;
};

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
  const draggableInstanceRef = useRef<DraggableInst | null>(null);
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
    gsap.to(pill, {
      x: 0,
      y: 0,
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        draggableInstanceRef.current?.update();
      },
    });
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
  }, [isDesktop, locationLabel, shouldMarquee, winW, winH, isMobileMenuOpen]);

  useLayoutEffect(() => {
    if (!isDesktop) return;
    void requestAnimationFrame(() => draggableInstanceRef.current?.update());
  }, [isDesktop, snapBox.w, snapBox.h]);

  useEffect(() => {
    const pill = pillRef.current;
    const handle = dragHandleRef.current;
    const snapZone = snapZoneRef.current;
    if (
      !isDesktop ||
      !pill ||
      !handle ||
      !snapZone ||
      typeof window === "undefined"
    ) {
      if (pill) gsap.set(pill, { clearProps: "x,y" });
      if (draggableInstanceRef.current) {
        draggableInstanceRef.current.kill();
        draggableInstanceRef.current = null;
      }
      return;
    }

    gsap.set(pill, { x: 0, y: 0 });
    gsap.set(snapZone, { opacity: 0, scale: 0.96 });

    let dInst: DraggableInst | null = null;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Draggable } = require("gsap/Draggable") as {
      Draggable: {
        create: (
          target: HTMLElement,
          vars: Record<string, unknown>
        ) => DraggableInst[];
      };
    };
    gsap.registerPlugin(Draggable);

    const applyBounds = () => {
      if (!dInst) return;
      const pad = 10;
      const rect = pill.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const dx = dInst.x;
      const dy = dInst.y;
      const baseLeft = rect.left - dx;
      const baseTop = rect.top - dy;
      let minX = pad - baseLeft;
      let maxX = window.innerWidth - pad - w - baseLeft;
      let minY = pad - baseTop;
      let maxY = window.innerHeight - pad - h - baseTop;
      if (minX > maxX) [minX, maxX] = [maxX, minX];
      if (minY > maxY) [minY, maxY] = [maxY, minY];
      dInst.applyBounds({ minX, maxX, minY, maxY });
    };

    const draggable = Draggable.create(pill, {
      type: "x,y",
      trigger: handle,
      cursor: "grab",
      activeCursor: "grabbing",
      dragClickables: false,
      minimumMovement: 4,
      zIndexBoost: false,
      onPress() {
        applyBounds();
        gsap.set(handle, { cursor: "grabbing" });
      },
      onRelease() {
        gsap.set(handle, { cursor: "grab" });
      },
      onDrag() {
        const dx = Number((this as { x: number }).x);
        const dy = Number((this as { y: number }).y);
        const dist = Math.hypot(dx, dy);
        const near = dist < SNAP_THRESHOLD_PX;
        gsap.to(snapZone, {
          opacity: near ? 1 : 0,
          scale: near ? 1 : 0.96,
          duration: 0.2,
          ease: "power2.out",
        });
      },
      onDragEnd() {
        gsap.to(snapZone, {
          opacity: 0,
          scale: 0.96,
          duration: 0.25,
          ease: "power2.out",
        });
        const dx = Number((this as { x: number }).x);
        const dy = Number((this as { y: number }).y);
        const dist = Math.hypot(dx, dy);
        if (dist < SNAP_THRESHOLD_PX) {
          gsap.to(pill, {
            x: 0,
            y: 0,
            duration: 0.85,
            ease: "elastic.out(1, 0.55)",
            onUpdate: () => dInst?.update(),
            onComplete: () => dInst?.update(),
          });
        }
      },
    })[0];

    dInst = draggable;
    draggableInstanceRef.current = draggable;
    applyBounds();
    window.addEventListener("resize", applyBounds, { passive: true });

    return () => {
      window.removeEventListener("resize", applyBounds);
      draggable.kill();
      draggableInstanceRef.current = null;
      gsap.set(pill, { clearProps: "x,y" });
    };
  }, [isDesktop, pathname, winW, winH]);

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

      <nav
        ref={pillRef}
        className={styles.pill}
        aria-label="Floating site navigation"
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
      </nav>
    </div>
  );
}
