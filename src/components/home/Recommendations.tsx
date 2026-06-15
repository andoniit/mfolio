"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import {
  NOTE_COLORS,
  initialsFromName,
  normalizeColor,
  DEFAULT_NOTE_COLOR,
  NAME_MAX,
  ROLE_MAX,
  MESSAGE_MAX,
  type PublicRecommendation,
} from "@/lib/recommendations";

const SESSION_KEY = "mf:recommendations:mine";
const COLLAPSE_CHARS = 180;

// `localId` is a stable React key that survives the temp→real id swap after the
// background save, so the optimistic note never remounts (and never re-animates).
type WallNote = PublicRecommendation & { pending?: boolean; localId?: string };

/** Stable pseudo-random in [0, 1) derived from an id + salt (deterministic). */
function rand01(id: string, salt: number): number {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** A stable, scattered layout for one note: rotation, offset, and tape spot. */
function scatterFor(id: string) {
  const tapeSpots = [24, 50, 76]; // left / centre / right (% across the top)
  return {
    rotate: (rand01(id, 1) * 2 - 1) * 6, // -6deg..6deg
    offsetX: (rand01(id, 2) * 2 - 1) * 22, // -22px..22px
    offsetY: (rand01(id, 3) * 2 - 1) * 24, // -24px..24px
    tapeLeft: tapeSpots[Math.floor(rand01(id, 4) * tapeSpots.length)],
    tapeRotate: (rand01(id, 5) * 2 - 1) * 10, // -10deg..10deg
  };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return slice.slice(0, lastSpace > 80 ? lastSpace : max).trimEnd() + "…";
}

type StoredNote = PublicRecommendation & { localId?: string };

function readStore(): StoredNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredNote[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(notes: StoredNote[]) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(notes));
  } catch {
    /* ignore quota / private mode */
  }
}

function loadMine(): WallNote[] {
  return readStore().map((r) => ({ ...r, pending: true }));
}

function StickyNote({
  note,
  index,
  constraints,
  bringToFront,
  flyFrom,
}: {
  note: WallNote;
  index: number;
  constraints: React.RefObject<HTMLDivElement | null>;
  bringToFront: () => number;
  flyFrom: boolean;
}) {
  const palette = NOTE_COLORS[normalizeColor(note.color)];
  const s = scatterFor(note.id);
  const [expanded, setExpanded] = useState(false);
  const [z, setZ] = useState(1);
  const articleRef = useRef<HTMLElement | null>(null);
  const controls = useAnimationControls();
  const isLong = note.message.length > COLLAPSE_CHARS;
  const shown = expanded || !isLong ? note.message : truncate(note.message, COLLAPSE_CHARS);

  // Whenever this note is touched/hovered, lift it above every other note and
  // keep it there (the most-recently-grabbed note always wins).
  const lift = () => setZ(bringToFront());

  const delay = Math.min(index * 0.07, 0.5);

  // Just-submitted note: fly from where the form was (viewport centre) into its
  // slot on the wall, so it reads as the form card travelling to its place.
  useLayoutEffect(() => {
    if (!flyFrom) return;
    const el = articleRef.current;
    if (!el) return;
    setZ(bringToFront());
    const rect = el.getBoundingClientRect();
    const dx = window.innerWidth / 2 - (rect.left + rect.width / 2);
    const dy = window.innerHeight / 2 - (rect.top + rect.height / 2);
    controls.set({ opacity: 1, x: dx, y: dy, scale: 1.5, rotate: 0 });
    controls.start({
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotate: s.rotate,
      transition: { type: "spring", stiffness: 200, damping: 22, delay: 0.12 },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyFrom]);

  return (
    // Wrapper carries the random offset (CSS transform) so the inner note is
    // free to use x/y for dragging without the two fighting.
    <div className="rec-cell" style={{ transform: `translate(${s.offsetX}px, ${s.offsetY}px)`, zIndex: z }}>
      <motion.article
        ref={articleRef}
        className="rec-note"
        style={
          {
            "--note-bg": palette.bg,
            "--note-edge": palette.edge,
            "--note-ink": palette.ink,
            "--note-avatar": palette.avatarBg,
          } as React.CSSProperties
        }
        initial={flyFrom ? false : { opacity: 0, scale: 0.6, y: -60, rotate: s.rotate - 14 }}
        animate={flyFrom ? controls : undefined}
        whileInView={flyFrom ? undefined : { opacity: 1, scale: 1, y: 0, rotate: s.rotate }}
        viewport={flyFrom ? undefined : { once: true, amount: 0.1 }}
        transition={flyFrom ? undefined : { type: "spring", stiffness: 220, damping: 13, mass: 0.9, delay }}
        drag
        dragConstraints={constraints}
        dragElastic={0.16}
        dragMomentum={false}
        onPointerDown={lift}
        onHoverStart={lift}
        whileHover={{ rotate: 0, scale: 1.04 }}
        whileDrag={{ scale: 1.06, boxShadow: "0 26px 46px rgba(0,0,0,0.24)" }}
      >
        {/* Tape sits at a random spot and "presses on" after the note lands. */}
        <motion.span
          className="rec-tape"
          aria-hidden="true"
          style={{ left: `${s.tapeLeft}%` }}
          initial={{ opacity: 0, y: -22, rotate: s.tapeRotate - 16, scale: 0.3 }}
          whileInView={{ opacity: 1, y: 0, rotate: s.tapeRotate, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 380, damping: 15, delay: delay + 0.4 }}
        />
      {note.pending && <span className="rec-pending">Pending review</span>}
      <p className="rec-message">{shown}</p>
      {isLong && (
        <button
          type="button"
          className="rec-more"
          onClick={() => setExpanded((v) => !v)}
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
        <div className="rec-author">
          <span className="rec-avatar">{initialsFromName(note.name)}</span>
          <span className="rec-meta">
            <span className="rec-name">{note.name}</span>
            {note.role && <span className="rec-role">{note.role}</span>}
          </span>
        </div>
      </motion.article>
    </div>
  );
}

// Variants for the staggered header entry.
const headContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};
const headItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function Recommendations() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const wallRef = useRef<HTMLDivElement | null>(null);

  // Monotonic z-index counter so the last-grabbed note stays on top.
  const zCounter = useRef(10);
  const bringToFront = useCallback(() => {
    zCounter.current += 1;
    return zCounter.current;
  }, []);

  const [approved, setApproved] = useState<PublicRecommendation[]>([]);
  const [mine, setMine] = useState<WallNote[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  // True after a successful submit: the form fades quickly (the note itself
  // flies to the wall) instead of sliding back down.
  const [flying, setFlying] = useState(false);
  // localId of the just-submitted note that should fly from the form to its slot.
  const [flyFromId, setFlyFromId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Initial load: approved from API + my pending notes from this browser.
  useEffect(() => {
    let active = true;
    setMine(loadMine());

    fetch("/api/recommendations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PublicRecommendation[]) => {
        if (active && Array.isArray(data)) setApproved(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Drop any of "my pending" notes that have since been approved (now in the
  // public list) so they aren't shown twice, and prune them from storage.
  useEffect(() => {
    if (mine.length === 0) return;
    const approvedIds = new Set(approved.map((r) => r.id));
    const stillPending = mine.filter((m) => !approvedIds.has(m.id));
    if (stillPending.length !== mine.length) {
      setMine(stillPending);
      writeStore(
        stillPending.map(({ pending: _pending, ...rest }) => rest as StoredNote)
      );
    }
  }, [approved, mine]);

  const notes: WallNote[] = useMemo(() => {
    // Pending (mine) first so the visitor sees their fresh note immediately.
    return [...mine, ...approved];
  }, [mine, approved]);

  const resetForm = () => {
    setName("");
    setRole("");
    setMessage("");
    setFeedback(null);
  };

  const openComposer = () => {
    setFlying(false);
    setComposerOpen(true);
  };

  const closeComposer = useCallback(() => {
    setFlying(false);
    setComposerOpen(false);
    setFeedback(null);
  }, []);

  // Close composer on Escape.
  useEffect(() => {
    if (!composerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeComposer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composerOpen, closeComposer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanName = name.trim();
    const cleanMessage = message.trim();
    if (!cleanName || !cleanMessage) {
      setFeedback({ kind: "err", text: "Name and recommendation are required." });
      return;
    }
    const cleanRole = role.trim() || null;

    // Optimistic: show the note on the wall instantly with a temporary id.
    const localId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimistic: WallNote = {
      localId,
      id: localId,
      name: cleanName,
      role: cleanRole,
      message: cleanMessage,
      color: DEFAULT_NOTE_COLOR,
      created_at: new Date().toISOString(),
      status: "pending",
      pending: true,
    };

    const { pending: _pending, ...storable } = optimistic;
    setMine((prev) => [optimistic, ...prev]);
    writeStore([storable, ...readStore()]);
    setFlyFromId(localId);

    // Fade the form out fast; the note flies from the form's spot to the wall.
    setFlying(true);
    resetForm();
    setComposerOpen(false);
    // Stop flagging it as "flying in" once the animation has settled.
    window.setTimeout(() => setFlyFromId(null), 1100);

    // Persist to the database in the background, then reconcile the real id.
    void (async () => {
      try {
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cleanName, role: cleanRole, message: cleanMessage }),
        });
        const result = await res.json().catch(() => null);
        if (!res.ok || !result?.ok) throw new Error(result?.message || "save failed");

        const created: PublicRecommendation = result.recommendation;
        // Swap temp id → real id (localId stays the React key, so no remount).
        setMine((prev) =>
          prev.map((n) =>
            n.localId === localId ? { ...n, id: created.id, color: created.color } : n
          )
        );
        writeStore(
          readStore().map((r) =>
            r.id === localId || r.localId === localId
              ? { ...r, id: created.id, color: created.color }
              : r
          )
        );
      } catch {
        // Roll back the optimistic note if the save failed.
        setMine((prev) => prev.filter((n) => n.localId !== localId));
        writeStore(readStore().filter((r) => r.id !== localId && r.localId !== localId));
        alert("Could not save your recommendation. Please try again.");
      }
    })();
  };

  return (
    <section id="recommendations" className="rec-section" ref={sectionRef}>
      <motion.div
        className="rec-grid"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 1.06 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <div className="rec-inner">
        <motion.div
          className="rec-head"
          variants={headContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          <div>
            <motion.p className="rec-eyebrow" variants={headItem}>Kind words</motion.p>
            <motion.h2 className="rec-title" variants={headItem}>Recommendations</motion.h2>
            <motion.p className="rec-sub" variants={headItem}>
              Worked with me, learned with me, or just have something nice to say? Pin a note to the wall —
              drag them around too.
            </motion.p>
          </div>
          <motion.button
            type="button"
            className="rec-add-btn"
            variants={headItem}
            onClick={openComposer}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Leave a recommendation
          </motion.button>
        </motion.div>

        <div className="rec-wall" ref={wallRef}>
          {notes.length === 0 ? (
            <div className="rec-empty">
              <p>No notes on the wall yet — be the first to leave one ✨</p>
            </div>
          ) : (
            notes.map((note, i) => (
              <StickyNote
                key={note.localId ?? note.id}
                note={note}
                index={i}
                constraints={wallRef}
                bringToFront={bringToFront}
                flyFrom={!!note.localId && note.localId === flyFromId}
              />
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {composerOpen && (
          <motion.div
            className="rec-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Leave a recommendation"
            onMouseDown={closeComposer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="rec-modal"
              onMouseDown={(e) => e.stopPropagation()}
              initial={{ y: "115%", rotate: -2, opacity: 0 }}
              animate={{ y: 0, rotate: 0, opacity: 1 }}
              exit={
                flying
                  ? { opacity: 0, scale: 0.92, transition: { duration: 0.18, ease: "easeOut" } }
                  : { y: "115%", opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }
              }
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
            >
              <span className="rec-tape rec-modal-tape" aria-hidden="true" />
              <button type="button" className="rec-close" onClick={closeComposer} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
              <h3 className="rec-modal-title">Leave a recommendation</h3>
              <p className="rec-modal-sub">It appears on the wall for you right away, and goes public once I approve it.</p>

              <form className="rec-form" onSubmit={handleSubmit}>
              <label className="rec-field">
                <span className="rec-label">Your name<span className="rec-req">*</span></span>
                <input
                  type="text"
                  value={name}
                  maxLength={NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Chen"
                  required
                />
              </label>

              <label className="rec-field">
                <span className="rec-label">Role / where from</span>
                <input
                  type="text"
                  value={role}
                  maxLength={ROLE_MAX}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Designer @ Figma"
                />
              </label>

              <label className="rec-field">
                <span className="rec-label">
                  Recommendation<span className="rec-req">*</span>
                  <span className="rec-count">{message.length}/{MESSAGE_MAX}</span>
                </span>
                <textarea
                  value={message}
                  maxLength={MESSAGE_MAX}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share a few words…"
                  rows={4}
                  required
                />
              </label>

              {feedback && (
                <p className={`rec-feedback ${feedback.kind === "ok" ? "is-ok" : "is-err"}`}>{feedback.text}</p>
              )}

              <button type="submit" className="rec-submit" disabled={submitting}>
                {submitting ? "Pinning…" : "Pin it to the wall"}
              </button>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RecStyles />
    </section>
  );
}

function RecStyles() {
  return (
    <style>{`
      .rec-section {
        position: relative;
        width: 100%;
        min-height: 100vh;
        padding: 7rem 2rem 8rem;
        background-color: #ffffff;
        font-family: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      }

      /* Graph-paper grid backdrop */
      .rec-grid {
        position: absolute;
        inset: -2px;
        z-index: 0;
        background-image:
          linear-gradient(to right, rgba(52, 52, 52, 0.07) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(52, 52, 52, 0.07) 1px, transparent 1px);
        background-size: 42px 42px;
        -webkit-mask-image: radial-gradient(ellipse 85% 75% at 50% 42%, #000 45%, transparent 100%);
        mask-image: radial-gradient(ellipse 85% 75% at 50% 42%, #000 45%, transparent 100%);
        pointer-events: none;
      }

      .rec-inner { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }

      .rec-head {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-end;
        gap: 2rem;
        margin-bottom: 3rem;
        flex-wrap: wrap;
      }
      .rec-eyebrow {
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--mf-purple, #6b63f7);
        margin: 0 0 0.5rem;
      }
      .rec-title {
        font-size: clamp(2.2rem, 4vw, 3.2rem);
        font-weight: 800;
        letter-spacing: -0.03em;
        color: var(--mf-dark, #343434);
        margin: 0;
        line-height: 1.05;
      }
      .rec-sub {
        font-size: 1.02rem;
        color: #666;
        margin: 0.75rem 0 0;
        max-width: 520px;
        line-height: 1.5;
      }
      .rec-add-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        background: var(--mf-dark, #343434);
        color: #fff;
        border: none;
        border-radius: 99px;
        padding: 0.8rem 1.4rem;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
        box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        white-space: nowrap;
      }
      .rec-add-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(0,0,0,0.18); }

      .rec-wall {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 2.25rem 1.75rem;
        align-items: start;
        min-height: 56vh;
      }

      .rec-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem 1rem;
        color: #999;
        font-size: 1.05rem;
      }

      /* Grid item — carries the random scatter offset; the note inside is the
         draggable card. */
      .rec-cell {
        position: relative;
      }

      .rec-note {
        position: relative;
        background: var(--note-bg);
        color: var(--note-ink);
        border-radius: 16px;
        padding: 2rem 1.5rem 1.4rem;
        box-shadow: 0 10px 22px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06);
        border: 1px solid var(--note-edge);
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        min-height: 180px;
        cursor: grab;
        touch-action: none;
        will-change: transform;
      }
      .rec-note:active { cursor: grabbing; }

      /* Translucent "tape" — the note shows through it. Centered with a
         negative margin (not translateX) so framer-motion can drive its
         transform for the stick-on animation without fighting the centering. */
      .rec-tape {
        position: absolute;
        top: -11px;
        left: 50%; /* overridden per-note via inline style for random placement */
        margin-left: -49px; /* centre the strip on its anchor point */
        width: 98px;
        height: 26px;
        background: linear-gradient(
          115deg,
          rgba(255, 255, 255, 0.88) 0%,
          rgba(255, 255, 255, 0.66) 45%,
          rgba(255, 255, 255, 0.85) 100%
        );
        border-left: 1.5px solid rgba(255, 255, 255, 0.9);
        border-right: 1.5px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.10);
        pointer-events: none;
      }

      .rec-pending {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        background: var(--note-ink);
        color: var(--note-bg);
        padding: 3px 8px;
        border-radius: 99px;
      }

      .rec-message {
        font-size: 1.02rem;
        line-height: 1.55;
        margin: 0;
        font-weight: 500;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .rec-more {
        align-self: flex-start;
        background: none;
        border: none;
        padding: 0;
        margin: -0.25rem 0 0;
        font: inherit;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--note-ink);
        opacity: 0.7;
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
      }
      .rec-more:hover { opacity: 1; }

      .rec-author {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        border-top: 1px dashed var(--note-edge);
        padding-top: 0.9rem;
        margin-top: auto;
      }
      .rec-avatar {
        flex-shrink: 0;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--note-avatar);
        color: var(--note-ink);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        font-weight: 800;
        letter-spacing: 0.02em;
      }
      .rec-meta { display: flex; flex-direction: column; min-width: 0; }
      .rec-name { font-weight: 700; font-size: 0.95rem; line-height: 1.2; }
      .rec-role { font-size: 0.8rem; opacity: 0.78; line-height: 1.3; }

      /* Composer — styled as a paper sticky note that slides up from below. */
      .rec-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15,15,20,0.55);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        z-index: 1000;
      }
      .rec-modal {
        position: relative;
        background: #fffdf3;
        border-radius: 16px;
        border: 1px solid #ece6d2;
        padding: 2.75rem 2rem 2rem;
        width: 100%;
        max-width: 440px;
        box-shadow: 0 30px 60px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.6);
        background-image:
          linear-gradient(to bottom, rgba(0,0,0,0.015) 1px, transparent 1px);
        background-size: 100% 2.1rem;
      }
      .rec-modal-tape {
        top: -13px;
        width: 130px;
        margin-left: -65px;
      }
      .rec-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #f3f3f3;
        color: #555;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.18s ease;
      }
      .rec-close:hover { background: #e8e8e8; }
      .rec-modal-title { font-size: 1.5rem; font-weight: 800; color: var(--mf-dark, #343434); margin: 0 0 0.4rem; letter-spacing: -0.02em; }
      .rec-modal-sub { font-size: 0.9rem; color: #777; margin: 0 0 1.5rem; line-height: 1.45; }

      .rec-form { display: flex; flex-direction: column; gap: 1.1rem; }
      .rec-field { display: flex; flex-direction: column; gap: 0.4rem; }
      .rec-label {
        font-size: 0.82rem;
        font-weight: 600;
        color: #444;
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }
      .rec-req { color: var(--mf-red, #ea3e3e); }
      .rec-count { margin-left: auto; font-weight: 500; color: #aaa; font-variant-numeric: tabular-nums; }
      .rec-field input,
      .rec-field textarea {
        width: 100%;
        box-sizing: border-box;
        border: 1.5px solid #e4e4e7;
        border-radius: 12px;
        padding: 0.7rem 0.9rem;
        font-size: 0.95rem;
        font-family: inherit;
        color: #111;
        background: #fafafa;
        transition: border-color 0.18s ease, background 0.18s ease;
        resize: vertical;
      }
      .rec-field input:focus,
      .rec-field textarea:focus {
        outline: none;
        border-color: var(--mf-purple, #6b63f7);
        background: #fff;
      }
      .rec-feedback { margin: 0; font-size: 0.85rem; font-weight: 500; }
      .rec-feedback.is-ok { color: #15803d; }
      .rec-feedback.is-err { color: var(--mf-red, #dc2626); }
      .rec-submit {
        margin-top: 0.3rem;
        background: var(--mf-dark, #343434);
        color: #fff;
        border: none;
        border-radius: 12px;
        padding: 0.85rem 1rem;
        font-size: 0.98rem;
        font-weight: 700;
        cursor: pointer;
        transition: opacity 0.18s ease, transform 0.18s ease;
      }
      .rec-submit:hover:not(:disabled) { transform: translateY(-1px); }
      .rec-submit:disabled { opacity: 0.6; cursor: default; }

      @media (max-width: 640px) {
        .rec-section { padding: 4.5rem 1.25rem 5.5rem; min-height: auto; }
        .rec-head { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
        .rec-add-btn { width: 100%; justify-content: center; }
        .rec-wall { grid-template-columns: 1fr; gap: 1.75rem; min-height: auto; }
      }
    `}</style>
  );
}
