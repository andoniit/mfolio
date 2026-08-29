"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GAME_STATUS_LABEL,
  type OutsideOfWorkPayload,
  type PublicOutsideItem,
} from "@/lib/outside-of-work";

const EMPTY: OutsideOfWorkPayload = { photos: [], gamePhotos: [], games: [] };

/* ------------------------------- photo mosaic ------------------------------ */

/**
 * A deliberately uneven mosaic: the first photo takes a tall cell and the rest
 * fill around it, so a handful of pictures still reads as a composition rather
 * than a grid of thumbnails.
 */
function PhotoMosaic({
  photos,
  onOpen,
  label,
  glyph,
}: {
  photos: PublicOutsideItem[];
  onOpen: (index: number) => void;
  label: string;
  glyph: React.ReactNode;
}) {
  return (
    <div className="oow-block">
      <div className="oow-block-head">
        <span className="oow-app-badge" aria-hidden="true">{glyph}</span>
        <h3>{label}</h3>
        {photos.length > 0 && <span className="oow-count">{photos.length}</span>}
      </div>
      {photos.length === 0 ? (
        <div className="oow-empty oow-empty--mosaic">
          <span>{label}</span>
          <em>Coming soon</em>
        </div>
      ) : (
        <MosaicGrid photos={photos} onOpen={onOpen} />
      )}
    </div>
  );
}

function MosaicGrid({
  photos,
  onOpen,
}: {
  photos: PublicOutsideItem[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="oow-mosaic" data-count={Math.min(photos.length, 5)}>
      {photos.slice(0, 5).map((photo, i) => (
        <motion.button
          key={photo.id}
          type="button"
          className="oow-tile"
          onClick={() => onOpen(i)}
          aria-label={`Open photo: ${photo.title}`}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.image_url ?? ""} alt={photo.title} loading="lazy" draggable={false} />
          <span className="oow-tile-caption">
            <strong>{photo.title}</strong>
            {photo.subtitle && <em>{photo.subtitle}</em>}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

/* -------------------------------- game list -------------------------------- */

function GameList({ games }: { games: PublicOutsideItem[] }) {
  return (
    <motion.div
      className="oow-games"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      <div className="oow-block-head">
        <span className="oow-app-badge" aria-hidden="true"><ControllerGlyph /></span>
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
                  <a
                    className="oow-game-row"
                    href={game.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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

  const shown = lightbox ? data[lightbox.set].slice(0, 5) : [];
  const step = useCallback(
    (delta: number) =>
      setLightbox((prev) => {
        if (!prev) return prev;
        const list = data[prev.set].slice(0, 5);
        if (list.length === 0) return prev;
        return { ...prev, index: (prev.index + delta + list.length) % list.length };
      }),
    [data]
  );

  useEffect(() => {
    if (lightbox === null) return;
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

      {/* Photos stand on their own; the two gaming blocks pair up beside each
          other, since captures and the played list belong together. */}
      <div className="oow-stack">
        <PhotoMosaic
          photos={data.photos}
          onOpen={(index) => setLightbox({ set: "photos", index })}
          label="Photos"
          glyph={<PhotosGlyph />}
        />

        <div className="oow-split">
          <PhotoMosaic
            photos={data.gamePhotos}
            onOpen={(index) => setLightbox({ set: "gamePhotos", index })}
            label="From the PS5"
            glyph={<PlayStationGlyph />}
          />
          <GameList games={data.games} />
        </div>
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
                    <span>{(lightbox?.index ?? 0) + 1}/{shown.length}</span>
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
        gap: 3.5rem;
        max-width: 1320px;
        margin: 0 auto;
      }

      /* Asymmetric on purpose: the captures carry the weight, the list sits
         beside them as a quieter column. */
      .oow-split {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
        gap: 2.5rem;
        align-items: start;
      }

      .oow-block { min-width: 0; }

      /* Each block is announced by its app mark, so the three read as three
         places rather than one long strip. */
      .oow-block-head {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin-bottom: 1.1rem;
      }
      .oow-block-head h3 {
        margin: 0;
        font-family: var(--font-coolvetica), sans-serif;
        font-size: 1.5rem;
        font-weight: 400;
        letter-spacing: 0.01em;
        color: #1d1d1b;
      }
      .oow-app-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        flex: 0 0 auto;
      }

      /* --- mosaic --- */
      .oow-mosaic {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: 190px;
        gap: 14px;
      }
      /* First photo anchors the composition. */
      .oow-mosaic > :first-child { grid-column: span 2; grid-row: span 2; }
      .oow-mosaic[data-count="1"] > :first-child { grid-column: span 3; }
      .oow-mosaic[data-count="2"] > :first-child { grid-column: span 2; grid-row: span 2; }
      .oow-mosaic[data-count="4"] > :nth-child(4) { grid-column: span 2; }

      .oow-tile {
        position: relative;
        display: block;
        padding: 0;
        border: 0;
        border-radius: 18px;
        overflow: hidden;
        background: #e9e8e3;
        cursor: zoom-in;
        transform: translateZ(0);
      }
      .oow-tile img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .oow-tile:hover img { transform: scale(1.06); }

      /* Caption rides in on hover; always visible on touch, where there is no
         hover to reveal it. */
      .oow-tile-caption {
        position: absolute;
        inset: auto 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 2.5rem 0.9rem 0.85rem;
        text-align: left;
        background: linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0));
        color: #fff;
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 0.35s ease, transform 0.35s ease;
        pointer-events: none;
      }
      .oow-tile:hover .oow-tile-caption,
      .oow-tile:focus-visible .oow-tile-caption { opacity: 1; transform: translateY(0); }
      .oow-tile-caption strong { font-size: 0.92rem; font-weight: 600; }
      .oow-tile-caption em { font-style: normal; font-size: 0.74rem; opacity: 0.8; }

      /* --- games --- */
      .oow-games {
        position: sticky;
        top: 2rem;
        padding: 1.5rem;
        background: #ffffff;
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 22px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
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
        display: flex;
        flex-direction: column;
      }
      .oow-game-list > li + li { border-top: 1px solid rgba(0,0,0,0.05); }

      .oow-game-row {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.7rem 0.2rem;
        text-decoration: none;
        color: inherit;
        transition: background 0.2s ease;
        border-radius: 10px;
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
      .oow-empty--mosaic {
        min-height: 400px;
        border: 1px dashed rgba(0,0,0,0.09);
        border-radius: 18px;
      }
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

      /* Stack once the two columns stop having room to breathe. */
      @media (max-width: 1000px) {
        .oow-stack { gap: 2.5rem; }
        .oow-split { grid-template-columns: 1fr; gap: 2.5rem; }
        .oow-games { position: static; }
        .oow-mosaic { grid-auto-rows: 165px; }
      }

      @media (max-width: 640px) {
        .oow-section { padding: 4rem 1.25rem 5rem; }
        .oow-heading { margin-bottom: 2.25rem; }
        .oow-mosaic { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 140px; gap: 10px; }
        .oow-mosaic > :first-child { grid-column: span 2; grid-row: span 1; }
        .oow-mosaic[data-count="4"] > :nth-child(4) { grid-column: span 1; }
        /* No hover on touch, so the caption has to stay put. */
        .oow-tile-caption { opacity: 1; transform: none; }
        .oow-games { padding: 1.15rem; }
      }
    `}</style>
  );
}
