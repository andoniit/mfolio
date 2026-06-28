"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import PolaroidScene, { type PolaroidSceneHandle } from "./PolaroidScene";
import styles from "./PolaroidSection.module.scss";

const SNAP_LINE = "Let's take a picture";
const EASE = [0.16, 1, 0.3, 1] as const;

export default function PolaroidSection() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<PolaroidSceneHandle>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.25 });

  const handleError = (msg: string) => {
    setError(msg);
    window.setTimeout(() => setError(null), 5000);
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
        <PolaroidScene ref={sceneRef} onCapture={setPhoto} onError={handleError} />
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
        </div>
      ) : (
        <p className={`${styles.hint} ${error ? styles.hintError : ""}`}>
          {error ?? "Tap the camera to take a Polaroid"}
        </p>
      )}
    </section>
  );
}
