"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GAME_STATUS_LABEL,
  type OutsideOfWorkPayload,
  type PublicOutsideItem,
} from "@/lib/outside-of-work";

const EMPTY: OutsideOfWorkPayload = { photos: [], food: [], games: [] };

/** Shared reveal for every tile — staggered by its position in the bento. */
const tileMotion = (index: number) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay: index * 0.08 },
});

/* ------------------------------ tile: photos ------------------------------ */

function PhotosTile({ photos }: { photos: PublicOutsideItem[] }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const count = photos.length;
  const go = useCallback(
    (delta: number) => setIndex((prev) => (count === 0 ? 0 : (prev + delta + count) % count)),
    [count]
  );

  // Slow auto-advance; the timer restarts whenever the slide changes so a manual
  // step gives you the full dwell time on the photo you just picked.
  useEffect(() => {
    if (count < 2 || lightbox) return;
    const id = window.setInterval(() => go(1), 6000);
    return () => window.clearInterval(id);
  }, [count, index, lightbox, go]);

  // Arrow keys / Escape while the lightbox is open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, go]);

  const current = photos[index];

  return (
    <motion.article className="oow-tile oow-tile--photos" {...tileMotion(0)}>
      <span className="oow-chip">Photos I shot</span>
      <span className="oow-app-badge oow-app-badge--photos" aria-hidden="true">
        <PhotosGlyph />
      </span>

      {count === 0 ? (
        <ComingSoon label="Photos" />
      ) : (
        <>
          <button
            type="button"
            className="oow-photo-stage"
            onClick={() => setLightbox(true)}
            aria-label={`Open photo: ${current.title}`}
          >
            {photos.map((photo, i) => (
              // All frames stay mounted and crossfade, so the browser keeps them
              // decoded and stepping through never flashes an empty frame.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                className={`oow-photo${i === index ? " is-active" : ""}`}
                src={photo.image_url ?? ""}
                alt={photo.title}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            ))}
          </button>

          <div className="oow-photo-bar">
            <div className="oow-photo-meta">
              <strong>{current.title}</strong>
              {current.subtitle && <span>{current.subtitle}</span>}
            </div>
            {count > 1 && (
              <div className="oow-photo-nav">
                <button type="button" onClick={() => go(-1)} aria-label="Previous photo">
                  ‹
                </button>
                <span className="oow-counter">
                  {index + 1}/{count}
                </span>
                <button type="button" onClick={() => go(1)} aria-label="Next photo">
                  ›
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {lightbox && current && (
          <motion.div
            className="oow-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
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
              </figcaption>
              <button
                type="button"
                className="oow-lightbox-close"
                onClick={() => setLightbox(false)}
                aria-label="Close photo"
              >
                ×
              </button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ------------------------------- tile: food ------------------------------- */

function FoodTile({ food }: { food: PublicOutsideItem[] }) {
  const top = food.slice(0, 5);

  return (
    <motion.article className="oow-tile oow-tile--food" {...tileMotion(1)}>
      <span className="oow-chip">Fav food spots</span>
      <span className="oow-app-badge oow-app-badge--safari" aria-hidden="true">
        <SafariGlyph />
      </span>

      {top.length === 0 ? (
        <ComingSoon label="Food spots" />
      ) : (
        <ul className="oow-food-list">
          {top.map((spot) => {
            const Row = (
              <>
                <span className="oow-food-thumb" aria-hidden="true">
                  {spot.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={spot.image_url} alt="" loading="lazy" />
                  ) : (
                    <span className="oow-food-initial">{spot.title.charAt(0)}</span>
                  )}
                </span>
                <span className="oow-food-text">
                  <strong>{spot.title}</strong>
                  {spot.subtitle && <span className="oow-food-sub">{spot.subtitle}</span>}
                </span>
                {spot.rating != null && (
                  <span className="oow-rating" aria-label={`${spot.rating} out of 5`}>
                    {"●".repeat(spot.rating)}
                    <span className="oow-rating-dim">{"●".repeat(5 - spot.rating)}</span>
                  </span>
                )}
              </>
            );

            return (
              <li key={spot.id}>
                {spot.link_url ? (
                  <a
                    className="oow-food-row"
                    href={spot.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {Row}
                  </a>
                ) : (
                  <div className="oow-food-row">{Row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </motion.article>
  );
}

/* ---------------------------- tile: now playing --------------------------- */

function NowPlayingTile({ game }: { game: PublicOutsideItem | null }) {
  return (
    <motion.article className="oow-tile oow-tile--playing" {...tileMotion(2)}>
      <span className="oow-chip">{game ? GAME_STATUS_LABEL[game.game_status ?? "playing"] : "On the PS5"}</span>
      <span className="oow-app-badge oow-app-badge--ps" aria-hidden="true">
        <PlayStationGlyph />
      </span>

      {!game ? (
        <ComingSoon label="Now playing" />
      ) : (
        <>
          <div className="oow-playing-art">
            {game.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={game.image_url} alt={game.title} loading="lazy" draggable={false} />
            ) : (
              <span className="oow-playing-fallback">{game.title}</span>
            )}
          </div>
          <div className="oow-playing-bar">
            <div className="oow-photo-meta">
              <strong>{game.title}</strong>
              {game.subtitle && <span>{game.subtitle}</span>}
            </div>
            {game.link_url && (
              <a
                className="oow-cta"
                href={game.link_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View
              </a>
            )}
          </div>
        </>
      )}
    </motion.article>
  );
}

/* ------------------------------- tile: games ------------------------------ */

function GamesTile({ games }: { games: PublicOutsideItem[] }) {
  return (
    <motion.article className="oow-tile oow-tile--games" {...tileMotion(3)}>
      <div className="oow-games-head">
        <span className="oow-chip">Games I&apos;ve played</span>
        {games.length > 0 && <span className="oow-count">{games.length}</span>}
      </div>
      <span className="oow-app-badge oow-app-badge--controller" aria-hidden="true">
        <ControllerGlyph />
      </span>

      {games.length === 0 ? (
        <ComingSoon label="Game library" />
      ) : (
        <ul className="oow-games-list">
          {games.map((game) => (
            <li key={game.id} className="oow-game-row">
              <span className="oow-game-cover" aria-hidden="true">
                {game.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.image_url} alt="" loading="lazy" />
                ) : (
                  <span className="oow-food-initial">{game.title.charAt(0)}</span>
                )}
              </span>
              <span className="oow-game-text">
                <strong>{game.title}</strong>
                {game.subtitle && <span className="oow-food-sub">{game.subtitle}</span>}
              </span>
              {game.game_status && (
                <span className={`oow-status oow-status--${game.game_status}`}>
                  {GAME_STATUS_LABEL[game.game_status]}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </motion.article>
  );
}

/* -------------------------------- section --------------------------------- */

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="oow-empty">
      <span>{label}</span>
      <em>Coming soon</em>
    </div>
  );
}

export default function OutsideOfWork() {
  const [data, setData] = useState<OutsideOfWorkPayload>(EMPTY);

  useEffect(() => {
    let active = true;
    fetch("/api/outside-of-work")
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((payload: OutsideOfWorkPayload) => {
        if (!active || !payload) return;
        setData({
          photos: payload.photos ?? [],
          food: payload.food ?? [],
          games: payload.games ?? [],
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // The "now playing" spotlight is whatever is marked `playing`; otherwise the
  // first game in the list, so the tile is never empty while games exist.
  const nowPlaying = useMemo(
    () => data.games.find((g) => g.game_status === "playing") ?? data.games[0] ?? null,
    [data.games]
  );

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

      <div className="oow-grid">
        <PhotosTile photos={data.photos} />
        <FoodTile food={data.food} />
        <NowPlayingTile game={nowPlaying} />
        <GamesTile games={data.games} />
      </div>

      <OutsideOfWorkStyles />
    </section>
  );
}

/* --------------------------------- glyphs --------------------------------- */

/**
 * App marks are drawn to match the real icons rather than approximated: the
 * Photos pinwheel (8 overlapping petals), Safari's compass, the PlayStation
 * monogram, and a DualSense silhouette. Each fills its own 24x24 box and sits
 * inside the white badge tile, the way an app icon reads on a home screen.
 */

/** Apple Photos — 8 petals radiating from the centre, blending where they meet. */
const PHOTO_PETALS = [
  "#f9c51d", // top, clockwise from here
  "#f6902a",
  "#ee5c42",
  "#e23e8e",
  "#9b4bd4",
  "#4e6de0",
  "#2bb3e8",
  "#57c05a",
];

function PhotosGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
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

/** Safari — the compass needle, red half pointing north-east. */
function SafariGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <defs>
        <linearGradient id="oow-safari-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3f7" />
          <stop offset="100%" stopColor="#1867e8" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11.4" fill="url(#oow-safari-face)" />
      <circle
        cx="12"
        cy="12"
        r="9.3"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.5"
        strokeWidth="0.7"
      />
      {/* Needle: two triangles meeting on the axis through the centre. */}
      <polygon points="16.4,7.6 13.34,13.34 10.66,10.66" fill="#f5453a" />
      <polygon points="7.6,16.4 13.34,13.34 10.66,10.66" fill="#f4f4f2" />
    </svg>
  );
}

/** PlayStation — the PS monogram, scaled and centred on the brand blue. */
function PlayStationGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <rect width="24" height="24" rx="5.4" fill="#0070d1" />
      <g transform="translate(3.31 2.82) scale(0.762)" fill="#ffffff">
        <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.499v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.041 1.472 1.576 2.072-.481.601-1.622 1.036-1.622 1.036l-8.544 3.107V18.838zM2.417 18.238c-1.898-.54-2.21-1.65-1.352-2.294.802-.585 2.152-1.036 2.152-1.036l5.596-2.003v2.279l-4.02 1.456c-.71.255-.82.622-.24.815.579.192 1.63.135 2.34-.12l1.92-.69v2.04c-.12.015-.255.03-.39.045-1.95.315-4.02.18-6.006-.492z" />
      </g>
    </svg>
  );
}

/** DualSense controller for the library tile. */
function ControllerGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        d="M9.2 6.6h5.6c2.9 0 5.3 2.1 5.8 4.9l.9 5.1a2.6 2.6 0 0 1-2.56 3.06c-.88 0-1.7-.45-2.18-1.2l-1.42-2.21H8.66l-1.42 2.21c-.48.75-1.3 1.2-2.18 1.2A2.6 2.6 0 0 1 2.5 16.6l.9-5.1c.5-2.8 2.9-4.9 5.8-4.9z"
        fill="#1d1d1b"
      />
      <path
        d="M7.3 10.5v3.1M5.75 12.05h3.1"
        stroke="#ffffff"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="16.75" cy="10.6" r="0.95" fill="#ffffff" />
      <circle cx="18.45" cy="12.3" r="0.95" fill="#ffffff" />
      <circle cx="15.05" cy="12.3" r="0.95" fill="#ffffff" />
      <circle cx="16.75" cy="14" r="0.95" fill="#ffffff" />
    </svg>
  );
}

/* --------------------------------- styles --------------------------------- */

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

      /* 12-column bento: a tall photo frame on the left, food + now-playing
         stacked in the middle, the full library running down the right. */
      .oow-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        grid-auto-rows: minmax(230px, auto);
        gap: 1.25rem;
        max-width: 1320px;
        margin: 0 auto;
      }

      .oow-tile {
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding: 1.15rem;
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.06);
        border-radius: 22px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }

      /* Explicit lines, not auto-placement: the games column must sit beside the
         food/now-playing stack, otherwise it wraps to a third row. */
      .oow-tile--photos { grid-column: 1 / span 6;  grid-row: 1 / span 2; padding: 0; }
      .oow-tile--food   { grid-column: 7 / span 3;  grid-row: 1; }
      .oow-tile--playing{ grid-column: 7 / span 3;  grid-row: 2; padding: 0; }
      .oow-tile--games  { grid-column: 10 / span 3; grid-row: 1 / span 2; }

      /* Floating labels shared by every tile. */
      .oow-chip {
        align-self: flex-start;
        z-index: 2;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(0, 0, 0, 0.06);
        backdrop-filter: blur(8px);
        font-size: 0.78rem;
        font-weight: 600;
        color: #2c2c2c;
        white-space: nowrap;
      }
      .oow-tile--photos > .oow-chip,
      .oow-tile--playing > .oow-chip { position: absolute; top: 1.15rem; left: 1.15rem; }

      .oow-app-badge {
        position: absolute;
        top: 1.15rem;
        right: 1.15rem;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
      }

      .oow-count {
        font-size: 0.78rem;
        font-weight: 600;
        color: #a3a39d;
        font-variant-numeric: tabular-nums;
      }

      /* --- photos --- */
      .oow-photo-stage {
        position: relative;
        flex: 1;
        display: block;
        width: 100%;
        min-height: 0;
        padding: 0;
        border: 0;
        background: #141414;
        cursor: zoom-in;
      }
      .oow-photo {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transform: scale(1.03);
        transition: opacity 0.8s ease, transform 0.8s ease;
        user-select: none;
      }
      .oow-photo.is-active { opacity: 1; transform: scale(1); }

      .oow-photo-bar,
      .oow-playing-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.95rem 1.15rem;
        background: #ffffff;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
      }
      .oow-photo-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .oow-photo-meta strong {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1d1d1b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .oow-photo-meta span { font-size: 0.78rem; color: #9a9a92; }

      .oow-photo-nav { display: flex; align-items: center; gap: 0.4rem; margin-left: auto; }
      .oow-photo-nav button {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: #fff;
        color: #4a4a48;
        font-size: 1.1rem;
        line-height: 1;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }
      .oow-photo-nav button:hover { background: #f1f1ee; transform: translateY(-1px); }
      .oow-counter {
        font-size: 0.75rem;
        color: #9a9a92;
        font-variant-numeric: tabular-nums;
        min-width: 34px;
        text-align: center;
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
        background: rgba(12, 12, 12, 0.88);
        backdrop-filter: blur(6px);
        cursor: zoom-out;
      }
      .oow-lightbox-inner {
        position: relative;
        margin: 0;
        max-width: min(1100px, 92vw);
        max-height: 88vh;
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
        align-items: baseline;
        gap: 0.6rem;
        color: #f2f2ef;
        font-size: 0.9rem;
      }
      .oow-lightbox-inner figcaption span { color: #a0a09a; font-size: 0.8rem; }
      .oow-lightbox-close {
        position: absolute;
        top: -14px;
        right: -14px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 0;
        background: #fff;
        color: #222;
        font-size: 1.3rem;
        line-height: 1;
        cursor: pointer;
      }

      /* --- food --- */
      .oow-food-list,
      .oow-games-list {
        list-style: none;
        margin: 0.9rem 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .oow-games-list { flex: 1; margin-top: 0.75rem; }

      .oow-food-row,
      .oow-game-row {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.5rem;
        border-radius: 12px;
        text-decoration: none;
        color: inherit;
        transition: background 0.2s ease;
      }
      a.oow-food-row:hover { background: #f4f4f1; }

      .oow-food-thumb,
      .oow-game-cover {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        overflow: hidden;
        background: #eceae4;
      }
      .oow-game-cover { width: 34px; height: 44px; border-radius: 6px; }
      .oow-food-thumb img,
      .oow-game-cover img { width: 100%; height: 100%; object-fit: cover; }
      .oow-food-initial {
        font-weight: 700;
        color: #b4b2aa;
        font-size: 0.95rem;
        text-transform: uppercase;
      }

      .oow-food-text,
      .oow-game-text {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
        flex: 1;
      }
      .oow-food-text strong,
      .oow-game-text strong {
        font-size: 0.88rem;
        font-weight: 600;
        color: #1d1d1b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .oow-food-sub {
        font-size: 0.74rem;
        color: #9a9a92;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .oow-rating { flex: 0 0 auto; font-size: 0.5rem; letter-spacing: 1px; color: var(--mf-red, #ea3e3e); }
      .oow-rating-dim { color: #dedcd5; }

      /* --- now playing --- */
      .oow-playing-art {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
        background: linear-gradient(150deg, #1c2436 0%, #0d1017 100%);
        overflow: hidden;
      }
      .oow-playing-art img { width: 100%; height: 100%; object-fit: cover; }
      .oow-playing-fallback {
        padding: 1.5rem;
        text-align: center;
        color: #e7e7e2;
        font-weight: 600;
      }

      .oow-cta {
        margin-left: auto;
        flex: 0 0 auto;
        padding: 7px 15px;
        border-radius: 999px;
        background: #141414;
        color: #fff;
        font-size: 0.78rem;
        font-weight: 600;
        text-decoration: none;
        transition: background 0.2s ease;
      }
      .oow-cta:hover { background: #333; }

      /* --- games --- */
      .oow-games-head { display: flex; align-items: center; gap: 0.6rem; padding-right: 3rem; }

      .oow-status {
        flex: 0 0 auto;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }
      .oow-status--playing   { background: #e6f2ff; color: #0059a8; }
      .oow-status--completed { background: #e6f6ea; color: #1c7a3d; }
      .oow-status--backlog   { background: #f2f1ec; color: #7b7a72; }
      .oow-status--wishlist  { background: #fdf0e6; color: #a35a17; }

      /* --- empty --- */
      .oow-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        min-height: 160px;
        color: #c3c2bb;
        text-align: center;
      }
      .oow-empty span { font-size: 0.85rem; font-weight: 600; }
      .oow-empty em {
        font-family: var(--font-coolvetica), sans-serif;
        font-style: normal;
        font-size: 1.35rem;
        letter-spacing: 0.02em;
        color: #dedcd5;
      }

      /* Two columns: photos on top, the three cards sharing the row below. */
      @media (max-width: 1100px) {
        .oow-grid { grid-template-columns: repeat(6, 1fr); }
        .oow-tile--photos { grid-column: 1 / span 6; grid-row: 1; min-height: 340px; }
        .oow-tile--food   { grid-column: 1 / span 3; grid-row: 2; }
        .oow-tile--playing{ grid-column: 4 / span 3; grid-row: 2; }
        .oow-tile--games  { grid-column: 1 / span 6; grid-row: 3; }
      }

      @media (max-width: 700px) {
        .oow-section { padding: 4rem 1.25rem 5rem; }
        .oow-heading { margin-bottom: 2.25rem; }
        .oow-grid { grid-template-columns: 1fr; gap: 1rem; }
        .oow-tile--photos { grid-column: 1; grid-row: 1; }
        .oow-tile--food   { grid-column: 1; grid-row: 2; }
        .oow-tile--playing{ grid-column: 1; grid-row: 3; }
        .oow-tile--games  { grid-column: 1; grid-row: 4; }
        .oow-tile--photos { min-height: 300px; }
        .oow-games-list { max-height: 340px; }
      }
    `}</style>
  );
}
