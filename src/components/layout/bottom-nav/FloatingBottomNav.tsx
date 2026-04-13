"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import styles from "./FloatingBottomNav.module.scss";

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const flipResetRef = useRef<number | null>(null);
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

  const locationLabel = useMemo(
    () => (pathname === "/" ? activeHomeLabel : getLocationLabel(pathname || "/")),
    [activeHomeLabel, pathname]
  );
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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

  if (!pathname || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      className={`${styles.wrapper} ${isNearFooter ? styles.hidden : ""}`}
      aria-hidden={isNearFooter}
    >
      <nav
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

        <div className={styles.locationSection}>
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

        <div className={styles.links}>
          <Link href="/" className={styles.link}>
            Home
          </Link>
          <Link href="/projects" className={styles.link}>
            Projects
          </Link>
          <Link href="/blog" className={styles.link}>
            Blog
          </Link>
        </div>

        <div className={styles.mobileMenu}>
          <button
            type="button"
            className={`${styles.menuButton} ${isMobileMenuOpen ? styles.menuButtonActive : ""}`}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="floating-bottom-nav-mobile-menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
    </div>
  );
}
