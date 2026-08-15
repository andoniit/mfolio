"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { polaroidDate, rand01, type PublicPhotoWallPost } from "@/lib/photo-wall";
import { PHOTO_WALL_EVENT, readMine, writeMine } from "@/lib/photo-wall-store";

type WallPhoto = PublicPhotoWallPost & { pending?: boolean };

/** A stable, scattered layout for one Polaroid: tilt, offset, pin placement. */
function scatterFor(id: string) {
  return {
    rotate: (rand01(id, 1) * 2 - 1) * 7, // -7deg..7deg
    offsetX: (rand01(id, 2) * 2 - 1) * 16,
    offsetY: (rand01(id, 3) * 2 - 1) * 22,
    pinLeft: 34 + rand01(id, 4) * 32, // 34%..66% across the top
  };
}

function Polaroid({
  photo,
  index,
  constraints,
  bringToFront,
}: {
  photo: WallPhoto;
  index: number;
  constraints: React.RefObject<HTMLDivElement | null>;
  bringToFront: () => number;
}) {
  const s = scatterFor(photo.id);
  const [z, setZ] = useState(1);
  const lift = () => setZ(bringToFront());
  const delay = Math.min(index * 0.06, 0.45);

  return (
    // Wrapper carries the scatter offset (CSS transform) so the card inside is
    // free to use x/y for dragging without the two fighting.
    <div className="pw-cell" style={{ transform: `translate(${s.offsetX}px, ${s.offsetY}px)`, zIndex: z }}>
      <motion.figure
        className="pw-card"
        initial={{ opacity: 0, scale: 0.7, y: -50, rotate: s.rotate - 12 }}
        whileInView={{ opacity: 1, scale: 1, y: 0, rotate: s.rotate }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ type: "spring", stiffness: 210, damping: 14, mass: 0.9, delay }}
        drag
        dragConstraints={constraints}
        dragElastic={0.16}
        dragMomentum={false}
        onPointerDown={lift}
        onHoverStart={lift}
        whileHover={{ rotate: 0, scale: 1.05 }}
        whileDrag={{ scale: 1.07, boxShadow: "0 28px 48px rgba(0,0,0,0.28)" }}
      >
        <motion.span
          className="pw-pin"
          aria-hidden="true"
          style={{ left: `${s.pinLeft}%` }}
          initial={{ opacity: 0, y: -18, scale: 0.4 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 380, damping: 15, delay: delay + 0.35 }}
        />
        {photo.pending && <span className="pw-badge">Pending review</span>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="pw-photo"
          src={photo.image_url}
          alt={photo.message}
          loading="lazy"
          draggable={false}
        />
        <figcaption className="pw-caption">
          <span className="pw-message">{photo.message}</span>
          <span className="pw-meta">
            {photo.author_name ? `— ${photo.author_name}` : ""}
            <span className="pw-date">{polaroidDate(photo.created_at)}</span>
          </span>
        </figcaption>
      </motion.figure>
    </div>
  );
}

export default function PhotoWall() {
  const wallRef = useRef<HTMLDivElement | null>(null);

  // Monotonic z-index counter so the last-grabbed photo stays on top.
  const zCounter = useRef(10);
  const bringToFront = useCallback(() => {
    zCounter.current += 1;
    return zCounter.current;
  }, []);

  const [approved, setApproved] = useState<PublicPhotoWallPost[]>([]);
  const [mine, setMine] = useState<WallPhoto[]>([]);

  // Initial load: approved photos from the API + my pending ones from this browser.
  useEffect(() => {
    let active = true;
    setMine(readMine().map((p) => ({ ...p, pending: true })));

    fetch("/api/photo-wall")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PublicPhotoWallPost[]) => {
        if (active && Array.isArray(data)) setApproved(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // A fresh submission from the camera section above pins itself immediately.
  useEffect(() => {
    const onAdded = (e: Event) => {
      const post = (e as CustomEvent<PublicPhotoWallPost>).detail;
      if (!post?.id) return;
      setMine((prev) => [{ ...post, pending: true }, ...prev.filter((p) => p.id !== post.id)]);
    };
    window.addEventListener(PHOTO_WALL_EVENT, onAdded);
    return () => window.removeEventListener(PHOTO_WALL_EVENT, onAdded);
  }, []);

  // Drop any of "mine" that have since been approved (they're in the public list
  // now) so they aren't shown twice, and prune them from storage.
  useEffect(() => {
    if (mine.length === 0) return;
    const approvedIds = new Set(approved.map((p) => p.id));
    const stillPending = mine.filter((p) => !approvedIds.has(p.id));
    if (stillPending.length !== mine.length) {
      setMine(stillPending);
      writeMine(stillPending.map(({ pending: _pending, ...rest }) => rest));
    }
  }, [approved, mine]);

  // Pending (mine) first so the visitor sees their fresh Polaroid immediately.
  const photos: WallPhoto[] = useMemo(() => [...mine, ...approved], [mine, approved]);

  return (
    // Deliberately unframed: no heading, no CTA, same white ground as the camera
    // section — this reads as the shelf under the camera, not its own section.
    <section id="photo-wall" className="pw-section">
      <div className="pw-inner">
        <motion.p
          className="pw-lede"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Snap a Polaroid with the camera above
        </motion.p>

        <div className="pw-wall" ref={wallRef}>
          {photos.length === 0 ? (
            <div className="pw-empty">
              <p>The wall is empty — be the first to pin a Polaroid 📸</p>
            </div>
          ) : (
            photos.map((photo, i) => (
              <Polaroid
                key={photo.id}
                photo={photo}
                index={i}
                constraints={wallRef}
                bringToFront={bringToFront}
              />
            ))
          )}
        </div>
      </div>

      <PhotoWallStyles />
    </section>
  );
}

function PhotoWallStyles() {
  return (
    <style>{`
      /* No top padding and the same white ground as the camera above, so the
         two run together as one continuous section. */
      .pw-section {
        position: relative;
        width: 100%;
        padding: 0 2rem 7rem;
        background: #ffffff;
        font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      }

      @font-face {
        font-family: 'Coolvetica';
        src: url('/fonts/Coolvetica Rg.otf') format('opentype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }

      .pw-inner { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }

      /* Same typographic voice as the camera's "tap to take a Polaroid" hint. */
      .pw-lede {
        margin: 0 0 2.5rem;
        text-align: center;
        font-family: 'Coolvetica', sans-serif;
        font-size: 0.95rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #b4b4b4;
      }

      .pw-wall {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 3rem 2rem;
        align-items: start;
        justify-items: center;
        min-height: 40vh;
      }

      .pw-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem 1rem;
        color: #999;
        font-size: 1.05rem;
      }

      .pw-cell { position: relative; }

      /* The Polaroid card: photo on top, handwritten caption on the lip. */
      .pw-card {
        position: relative;
        width: 100%;
        max-width: 220px;
        margin: 0;
        padding: 12px 12px 0;
        background: #fbfbf6;
        border-radius: 4px;
        box-shadow: 0 12px 28px rgba(0,0,0,0.16), 0 2px 4px rgba(0,0,0,0.06);
        cursor: grab;
        touch-action: none;
        will-change: transform;
      }
      .pw-card:active { cursor: grabbing; }

      /* Push pin holding the photo to the wall. */
      .pw-pin {
        position: absolute;
        top: -9px;
        margin-left: -9px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: radial-gradient(circle at 34% 30%, #ff7a7a 0%, var(--mf-red, #ea3e3e) 55%, #a81f1f 100%);
        box-shadow: 0 3px 6px rgba(0,0,0,0.28);
        pointer-events: none;
      }

      .pw-badge {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        background: rgba(20,20,20,0.82);
        color: #fff;
        padding: 3px 8px;
        border-radius: 99px;
        pointer-events: none;
      }

      .pw-photo {
        display: block;
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        background: #141414;
        user-select: none;
        -webkit-user-drag: none;
      }

      .pw-caption {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-height: 74px;
        padding: 10px 6px 12px;
        text-align: center;
      }
      .pw-message {
        font-family: var(--font-sue-ellen), 'Segoe Script', cursive;
        font-size: 1.1rem;
        line-height: 1.15;
        color: #3a3a3a;
        word-break: break-word;
      }
      .pw-meta {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.68rem;
        color: #9a9a92;
        letter-spacing: 0.02em;
      }
      .pw-date { font-style: italic; }

      @media (max-width: 640px) {
        .pw-section { padding: 0 1.25rem 5rem; }
        .pw-lede { margin-bottom: 2rem; font-size: 0.78rem; letter-spacing: 0.05em; }
        .pw-wall { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 2.25rem 1rem; }
      }
    `}</style>
  );
}
