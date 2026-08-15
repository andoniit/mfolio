"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import PolaroidScene, { type PolaroidSceneHandle } from "./PolaroidScene";
import { AUTHOR_MAX, MESSAGE_MAX, type PublicPhotoWallPost } from "@/lib/photo-wall";
import { addMine } from "@/lib/photo-wall-store";
import styles from "./PolaroidSection.module.scss";

const SNAP_LINE = "Let's take a picture";
const EASE = [0.16, 1, 0.3, 1] as const;

export default function PolaroidSection() {
  const [photo, setPhoto] = useState<string | null>(null);
  // Bare square shot that gets pinned to the wall (the frame is CSS there).
  const [square, setSquare] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<PolaroidSceneHandle>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.25 });

  // Photo-wall composer
  const [composerOpen, setComposerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleError = (msg: string) => {
    setError(msg);
    window.setTimeout(() => setError(null), 5000);
  };

  const handleCapture = (framed: string, squareShot: string) => {
    setPhoto(framed);
    setSquare(squareShot);
    setSubmitted(false);
  };

  const download = () => {
    if (!photo) return;
    const a = document.createElement("a");
    a.href = photo;
    a.download = `polaroid-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const retake = () => sceneRef.current?.retake();

  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    setFormError(null);
  }, []);

  // Close the composer on Escape.
  useEffect(() => {
    if (!composerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeComposer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composerOpen, closeComposer]);

  const submitToWall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !square) return;

    const cleanMessage = message.trim();
    if (!cleanMessage) {
      setFormError("Write a little something on the photo first.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/photo-wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo: square,
          message: cleanMessage,
          author_name: author.trim() || null,
        }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.ok) {
        setFormError(result?.message || "Could not send your photo. Please try again.");
        return;
      }

      // Pin it to the wall right away, badged as pending, and remember it in
      // this browser so it survives a reload until it's approved.
      addMine(result.post as PublicPhotoWallPost);

      setSubmitted(true);
      setComposerOpen(false);
      setMessage("");
      setAuthor("");
    } catch {
      setFormError("Could not send your photo. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} className={styles.section} aria-label="Take a Polaroid photo">
      {/* Three lines of looping gray text behind the camera (row 0 → right,
          row 1 → left, row 2 → right). On entrance each line slides in from the
          side it scrolls toward: right-movers from the left, left-mover from the
          right. The inner element keeps the continuous loop. */}
      <div className={styles.bgText} aria-hidden="true">
        {[0, 1, 2].map((row) => {
          const movesRight = row % 2 === 0;
          return (
            <motion.div
              key={row}
              className={styles.bgRow}
              initial={{ x: movesRight ? "-60vw" : "60vw", opacity: 0 }}
              animate={inView ? { x: 0, opacity: 1 } : undefined}
              transition={{ duration: 1, ease: EASE, delay: row * 0.12 }}
            >
              <div className={`${styles.bgLine} ${movesRight ? styles.bgLineRight : ""}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i}>{SNAP_LINE}&nbsp;&nbsp;&nbsp;</span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className={styles.cameraStage}
        initial={{ y: -180, opacity: 0 }}
        animate={inView ? { y: 0, opacity: 1 } : undefined}
        transition={{ type: "spring", stiffness: 80, damping: 13, delay: 0.15 }}
      >
        <PolaroidScene ref={sceneRef} onCapture={handleCapture} onError={handleError} />
      </motion.div>

      {photo ? (
        <div className={styles.result}>
          <img src={photo} alt="Your Polaroid" className={styles.resultPhoto} />
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn} onClick={download}>
              ↓ Download
            </button>
            <button type="button" className={styles.retakeBtn} onClick={retake}>
              ↺ Retake
            </button>
          </div>
          {submitted ? (
            <p className={styles.pinnedNote}>Sent for approval — it appears below ✓</p>
          ) : (
            <button
              type="button"
              className={styles.pinBtn}
              onClick={() => {
                setSubmitted(false);
                setComposerOpen(true);
              }}
            >
              ✎ Write on it &amp; pin to the wall
            </button>
          )}
        </div>
      ) : (
        <p className={`${styles.hint} ${error ? styles.hintError : ""}`}>
          {error ?? "Tap the camera to take a Polaroid"}
        </p>
      )}

      <AnimatePresence>
        {composerOpen && square && (
          <motion.div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-label="Write on your Polaroid"
            onMouseDown={closeComposer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <motion.div
              className={styles.modal}
              onMouseDown={(e) => e.stopPropagation()}
              initial={{ y: 60, opacity: 0, rotate: -1.5 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 40, opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
            >
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeComposer}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Live preview of exactly how the Polaroid lands on the wall. */}
              <figure className={styles.previewCard}>
                <img src={square} alt="Your photo" className={styles.previewPhoto} />
                <figcaption className={styles.previewCaption}>
                  {message.trim() || "your message here…"}
                </figcaption>
              </figure>

              <form className={styles.form} onSubmit={submitToWall}>
                <h3 className={styles.modalTitle}>Pin it to the wall</h3>
                <p className={styles.modalSub}>
                  Write something on your Polaroid. It goes up on the wall below once I approve it.
                </p>

                <label className={styles.field}>
                  <span className={styles.label}>
                    Your message
                    <span className={styles.count}>
                      {message.length}/{MESSAGE_MAX}
                    </span>
                  </span>
                  <textarea
                    value={message}
                    maxLength={MESSAGE_MAX}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Say hi, drop a note…"
                    rows={3}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Your name (optional)</span>
                  <input
                    type="text"
                    value={author}
                    maxLength={AUTHOR_MAX}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Sarah"
                  />
                </label>

                {formError && <p className={styles.formError}>{formError}</p>}

                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? "Sending…" : "Send for approval"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
