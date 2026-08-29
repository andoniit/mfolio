"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GAME_STATUS_LABEL,
  type OutsideOfWorkPayload,
  type PublicOutsideItem,
} from "@/lib/outside-of-work";

const EMPTY: OutsideOfWorkPayload = { photos: [], gamePhotos: [], games: [] };

/* ------------------------------ carousel card ------------------------------ */

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d={dir === "left" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"}
        stroke="#2b2b29"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * One photo at a time in a card: a chip naming the set, the app mark it came
 * from, and a pill of controls under it. All frames stay mounted and crossfade,
 * so stepping through never flashes an empty stage.
 */
function PhotoCarousel({
  photos,
  label,
  glyph,
  onOpen,
}: {
  photos: PublicOutsideItem[];
  label: string;
  glyph: React.ReactNode;
  onOpen: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const count = photos.length;

  const go = useCallback(
    (delta: number) => setIndex((prev) => (count === 0 ? 0 : (prev + delta + count) % count)),
    [count]
  );

  // Slow auto-advance; the timer restarts on every change, so a manual step
  // gives you the full dwell on the photo you just chose.
  useEffect(() => {
    if (count < 2) return;
    const id = window.setInterval(() => go(1), 6500);
    return () => window.clearInterval(id);
  }, [count, index, go]);

  const current = photos[index];

  return (
    <motion.article
      className="oow-card"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="oow-chip">{label}</span>
      <span className="oow-app-badge" aria-hidden="true">{glyph}</span>

      {count === 0 ? (
        <div className="oow-empty oow-empty--stage">
          <span>{label}</span>
          <em>Coming soon</em>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="oow-stage"
            onClick={() => onOpen(index)}
            aria-label={`Open photo: ${current.title}`}
          >
            {photos.map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                className={`oow-frame${i === index ? " is-active" : ""}`}
                src={photo.image_url ?? ""}
                alt={photo.title}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            ))}
          </button>

          <div className="oow-bar">
            <div className="oow-meta">
              <strong>{current.title}</strong>
              {current.subtitle && <span>{current.subtitle}</span>}
            </div>

            {count > 1 && (
              <div className="oow-nav">
                <button type="button" onClick={() => go(-1)} aria-label="Previous photo">
                  <Chevron dir="left" />
                </button>
                <span className="oow-nav-count">
                  {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                </span>
                <button type="button" onClick={() => go(1)} aria-label="Next photo">
                  <Chevron dir="right" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </motion.article>
  );
}

/* -------------------------------- game list -------------------------------- */

function GameList({ games }: { games: PublicOutsideItem[] }) {
  return (
    <motion.div
      className="oow-games"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
    >
      <div className="oow-block-head">
        <span className="oow-app-badge oow-app-badge--inline" aria-hidden="true">
          <ControllerGlyph />
        </span>
        <h3>Games I&apos;ve played</h3>
        {games.length > 0 && <span className="oow-count">{games.length}</span>}
      </div>

      {games.length === 0 ? (
        <div className="oow-empty">
          <span>Game library</span>
          <em>Coming soon</em>
        </div>
      ) : (
        <ol className="oow-game-list">
          {games.map((game, i) => {
            const row = (
              <>
                <span className="oow-game-index">{String(i + 1).padStart(2, "0")}</span>
                <span className="oow-game-cover" aria-hidden="true">
                  {game.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.image_url} alt="" loading="lazy" />
                  ) : (
                    <span className="oow-game-initial">{game.title.charAt(0)}</span>
                  )}
                </span>
                <span className="oow-game-text">
                  <strong>{game.title}</strong>
                  {game.subtitle && <span className="oow-game-sub">{game.subtitle}</span>}
                </span>
                {game.game_status && (
                  <span className={`oow-status oow-status--${game.game_status}`}>
                    {GAME_STATUS_LABEL[game.game_status]}
                  </span>
                )}
              </>
            );

            return (
              <li key={game.id}>
                {game.link_url ? (
                  <a className="oow-game-row" href={game.link_url} target="_blank" rel="noopener noreferrer">
                    {row}
                  </a>
                ) : (
                  <div className="oow-game-row">{row}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </motion.div>
  );
}

/* --------------------------------- section --------------------------------- */

export default function OutsideOfWork() {
  const [data, setData] = useState<OutsideOfWorkPayload>(EMPTY);
  // Which set the lightbox is walking, and where in it.
  const [lightbox, setLightbox] = useState<{ set: "photos" | "gamePhotos"; index: number } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/outside-of-work")
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((payload: OutsideOfWorkPayload) => {
        if (!active || !payload) return;
        setData({
          photos: payload.photos ?? [],
          gamePhotos: payload.gamePhotos ?? [],
          games: payload.games ?? [],
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const shown = lightbox ? data[lightbox.set] : [];
  const step = useCallback(
    (delta: number) =>
      setLightbox((prev) => {
        if (!prev) return prev;
        const list = data[prev.set];
        if (list.length === 0) return prev;
        return { ...prev, index: (prev.index + delta + list.length) % list.length };
      }),
    [data]
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, step]);

  const current = lightbox ? shown[lightbox.index] : null;

  return (
    <section id="outside-of-work" className="oow-section">
      <motion.h2
        className="oow-heading"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        /* Outside of work */
      </motion.h2>

      <div className="oow-stack">
        {/* The two card sets pair off; the list runs full width beneath them. */}
        <div className="oow-cards">
          <PhotoCarousel
            photos={data.photos}
            label="Photos I shot"
            glyph={<PhotosGlyph />}
            onOpen={(index) => setLightbox({ set: "photos", index })}
          />
          <PhotoCarousel
            photos={data.gamePhotos}
            label="From the PS5"
            glyph={<PlayStationGlyph />}
            onOpen={(index) => setLightbox({ set: "gamePhotos", index })}
          />
        </div>

        <GameList games={data.games} />
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            className="oow-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label={current.title}
          >
            <motion.figure
              className="oow-lightbox-inner"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.image_url ?? ""} alt={current.title} />
              <figcaption>
                <strong>{current.title}</strong>
                {current.subtitle && <span>{current.subtitle}</span>}
                {shown.length > 1 && (
                  <span className="oow-lightbox-nav">
                    <button type="button" onClick={() => step(-1)} aria-label="Previous photo">‹</button>
                    <span>
                      {String((lightbox?.index ?? 0) + 1).padStart(2, "0")} / {String(shown.length).padStart(2, "0")}
                    </span>
                    <button type="button" onClick={() => step(1)} aria-label="Next photo">›</button>
                  </span>
                )}
              </figcaption>
              <button
                type="button"
                className="oow-lightbox-close"
                onClick={() => setLightbox(null)}
                aria-label="Close photo"
              >
                ×
              </button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>

      <OutsideOfWorkStyles />
    </section>
  );
}

/* --------------------------------- glyphs ---------------------------------- */

/**
 * App marks drawn to match the real icons rather than approximated: the Photos
 * pinwheel over the pictures, the PlayStation monogram over the PS5 captures,
 * and a DualSense for the played list.
 */
const PHOTO_PETALS = ["#f9c51d", "#f6902a", "#ee5c42", "#e23e8e", "#9b4bd4", "#4e6de0", "#2bb3e8", "#57c05a"];

function PhotosGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {PHOTO_PETALS.map((color, i) => (
        <ellipse
          key={color}
          cx="12"
          cy="7.7"
          rx="2.9"
          ry="4.9"
          transform={`rotate(${i * 45} 12 12)`}
          fill={color}
          opacity="0.82"
        />
      ))}
    </svg>
  );
}

function PlayStationGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect width="24" height="24" rx="5.4" fill="#0070d1" />
      <g transform="translate(3.31 2.82) scale(0.762)" fill="#ffffff">
        <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.499v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.041 1.472 1.576 2.072-.481.601-1.622 1.036-1.622 1.036l-8.544 3.107V18.838zM2.417 18.238c-1.898-.54-2.21-1.65-1.352-2.294.802-.585 2.152-1.036 2.152-1.036l5.596-2.003v2.279l-4.02 1.456c-.71.255-.82.622-.24.815.579.192 1.63.135 2.34-.12l1.92-.69v2.04c-.12.015-.255.03-.39.045-1.95.315-4.02.18-6.006-.492z" />
      </g>
    </svg>
  );
}

function ControllerGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M9.2 6.6h5.6c2.9 0 5.3 2.1 5.8 4.9l.9 5.1a2.6 2.6 0 0 1-2.56 3.06c-.88 0-1.7-.45-2.18-1.2l-1.42-2.21H8.66l-1.42 2.21c-.48.75-1.3 1.2-2.18 1.2A2.6 2.6 0 0 1 2.5 16.6l.9-5.1c.5-2.8 2.9-4.9 5.8-4.9z"
        fill="#1d1d1b"
      />
      <path d="M7.3 10.5v3.1M5.75 12.05h3.1" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="16.75" cy="10.6" r="0.95" fill="#ffffff" />
      <circle cx="18.45" cy="12.3" r="0.95" fill="#ffffff" />
      <circle cx="15.05" cy="12.3" r="0.95" fill="#ffffff" />
      <circle cx="16.75" cy="14" r="0.95" fill="#ffffff" />
    </svg>
  );
}

/* --------------------------------- styles ---------------------------------- */

function OutsideOfWorkStyles() {
  return (
    <style>{`
      .oow-section {
        position: relative;
        width: 100%;
        padding: 6rem 2rem 7rem;
        background: #f7f7f5;
        font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        box-sizing: border-box;
      }

      .oow-heading {
        margin: 0 auto 3.5rem;
        max-width: 1320px;
        text-align: center;
        font-family: var(--font-coolvetica), sans-serif;
        font-size: clamp(2rem, 6vw, 4.25rem);
        font-weight: 400;
        letter-spacing: -0.01em;
        color: #cfcfcb;
      }

      .oow-stack {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        max-width: 1320px;
        margin: 0 auto;
      }
      .oow-cards {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 2rem;
        align-items: start;
      }

      /* --- the card --- */
      .oow-card {
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0;
        background: #ffffff;
        border: 1px solid rgba(0,0,0,0.05);
        border-radius: 26px;
        box-shadow: 0 14px 38px rgba(0,0,0,0.07);
        overflow: hidden;
      }

      .oow-chip {
        position: absolute;
        top: 1.1rem;
        left: 1.1rem;
        z-index: 2;
        padding: 8px 15px;
        border-radius: 999px;
        background: rgba(255,255,255,0.94);
        backdrop-filter: blur(8px);
        font-size: 0.84rem;
        font-weight: 500;
        color: #2b2b29;
        white-space: nowrap;
      }

      .oow-app-badge {
        position: absolute;
        top: 1.1rem;
        right: 1.1rem;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 13px;
        background: #ffffff;
        box-shadow: 0 6px 16px rgba(0,0,0,0.15);
      }
      /* The games header uses the same mark inline, in normal flow. */
      .oow-app-badge--inline {
        position: static;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        flex: 0 0 auto;
      }

      .oow-stage {
        position: relative;
        display: block;
        width: 100%;
        aspect-ratio: 3 / 2;
        padding: 0;
        border: 0;
        background: #141414;
        cursor: zoom-in;
        overflow: hidden;
      }
      .oow-frame {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transform: scale(1.03);
        transition: opacity 0.85s ease, transform 0.85s ease;
        user-select: none;
      }
      .oow-frame.is-active { opacity: 1; transform: scale(1); }

      .oow-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.25rem 1.15rem;
        background: #ffffff;
      }
      .oow-meta { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
      .oow-meta strong {
        font-size: 1.05rem;
        font-weight: 600;
        color: #1d1d1b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .oow-meta span { font-size: 0.82rem; color: #9a9a92; }

      /* --- the pill of controls --- */
      .oow-nav {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: auto;
        padding: 5px;
        background: #efeeeb;
        border-radius: 999px;
        flex: 0 0 auto;
      }
      .oow-nav button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.13);
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .oow-nav button:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.16); }
      .oow-nav button:active { transform: translateY(0); }
      .oow-nav-count {
        min-width: 58px;
        text-align: center;
        font-size: 0.92rem;
        font-weight: 700;
        letter-spacing: 0.01em;
        color: #1d1d1b;
        font-variant-numeric: tabular-nums;
      }

      /* --- games --- */
      .oow-games {
        padding: 1.5rem;
        background: #ffffff;
        border: 1px solid rgba(0,0,0,0.05);
        border-radius: 26px;
        box-shadow: 0 14px 38px rgba(0,0,0,0.07);
      }
      .oow-block-head {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin-bottom: 1rem;
      }
      .oow-block-head h3 {
        margin: 0;
        font-family: var(--font-coolvetica), sans-serif;
        font-size: 1.5rem;
        font-weight: 400;
        letter-spacing: 0.01em;
        color: #1d1d1b;
      }
      .oow-count {
        font-size: 0.78rem;
        font-weight: 600;
        color: #a3a39d;
        font-variant-numeric: tabular-nums;
      }

      .oow-game-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 0 1.5rem;
      }
      .oow-game-row {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.7rem 0.2rem;
        text-decoration: none;
        color: inherit;
        border-radius: 10px;
        border-top: 1px solid rgba(0,0,0,0.05);
        transition: background 0.2s ease;
      }
      a.oow-game-row:hover { background: #f6f6f3; }

      .oow-game-index {
        flex: 0 0 auto;
        width: 1.4rem;
        font-size: 0.68rem;
        font-weight: 700;
        color: #cfcec7;
        font-variant-numeric: tabular-nums;
      }
      .oow-game-cover {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 46px;
        height: 60px;
        border-radius: 7px;
        overflow: hidden;
        background: #eceae4;
      }
      .oow-game-cover img { width: 100%; height: 100%; object-fit: cover; }
      .oow-game-initial { font-weight: 700; color: #b4b2aa; text-transform: uppercase; }

      .oow-game-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
      .oow-game-text strong {
        font-size: 0.9rem;
        font-weight: 600;
        color: #1d1d1b;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .oow-game-sub {
        font-size: 0.74rem;
        color: #9a9a92;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .oow-status {
        flex: 0 0 auto;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }
      .oow-status--playing   { background: #e6f2ff; color: #0059a8; }
      .oow-status--half_done { background: #f3ecff; color: #6b3fc4; }
      .oow-status--completed { background: #e6f6ea; color: #1c7a3d; }
      .oow-status--backlog   { background: #f2f1ec; color: #7b7a72; }
      .oow-status--wishlist  { background: #fdf0e6; color: #a35a17; }

      /* --- empty --- */
      .oow-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        min-height: 170px;
        color: #c3c2bb;
        text-align: center;
      }
      .oow-empty--stage { aspect-ratio: 3 / 2; min-height: 0; background: #fbfbf9; }
      .oow-empty span { font-size: 0.85rem; font-weight: 600; }
      .oow-empty em {
        font-family: var(--font-coolvetica), sans-serif;
        font-style: normal;
        font-size: 1.35rem;
        color: #dedcd5;
      }

      /* --- lightbox --- */
      .oow-lightbox {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: rgba(12,12,12,0.88);
        backdrop-filter: blur(6px);
        cursor: zoom-out;
      }
      .oow-lightbox-inner {
        position: relative;
        margin: 0;
        max-width: min(1100px, 92vw);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        cursor: default;
      }
      .oow-lightbox-inner img {
        max-width: 100%;
        max-height: 78vh;
        object-fit: contain;
        border-radius: 12px;
      }
      .oow-lightbox-inner figcaption {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        color: #f2f2ef;
        font-size: 0.9rem;
      }
      .oow-lightbox-inner figcaption span { color: #a0a09a; font-size: 0.8rem; }
      .oow-lightbox-nav { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; }
      .oow-lightbox-nav button {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.25);
        background: transparent;
        color: #f2f2ef;
        font-size: 1rem;
        line-height: 1;
        cursor: pointer;
      }
      .oow-lightbox-nav button:hover { background: rgba(255,255,255,0.12); }
      .oow-lightbox-close {
        position: absolute;
        top: -14px; right: -14px;
        width: 34px; height: 34px;
        border-radius: 50%;
        border: 0;
        background: #fff;
        color: #222;
        font-size: 1.3rem;
        line-height: 1;
        cursor: pointer;
      }

      @media (max-width: 900px) {
        .oow-cards { grid-template-columns: 1fr; gap: 1.5rem; }
        .oow-stack { gap: 1.5rem; }
      }

      @media (max-width: 640px) {
        .oow-section { padding: 4rem 1.25rem 5rem; }
        .oow-heading { margin-bottom: 2.25rem; }
        .oow-card, .oow-games { border-radius: 20px; }
        .oow-bar { flex-wrap: wrap; gap: 0.75rem; padding: 0.9rem 1rem 1rem; }
        .oow-nav { margin-left: 0; }
        .oow-meta strong { font-size: 0.98rem; }
        .oow-games { padding: 1.15rem; }
        .oow-game-list { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}
