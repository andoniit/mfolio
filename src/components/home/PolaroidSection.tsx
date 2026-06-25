"use client";

import { useRef, useState } from "react";
import PolaroidScene, { type PolaroidSceneHandle } from "./PolaroidScene";
import styles from "./PolaroidSection.module.scss";

const SNAP_LINE = "Let's take a snap";

export default function PolaroidSection() {
  const [photo, setPhoto] = useState<string | null>(null);
  const sceneRef = useRef<PolaroidSceneHandle>(null);

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
    <section className={styles.section} aria-label="Take a Polaroid photo">
      {/* Three lines of looping gray text behind the camera:
          row 0 → right, row 1 → left, row 2 → right. */}
      <div className={styles.bgText} aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className={`${styles.bgLine} ${row % 2 === 0 ? styles.bgLineRight : ""}`}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i}>{SNAP_LINE}&nbsp;&nbsp;&nbsp;</span>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.cameraStage}>
        <PolaroidScene ref={sceneRef} onCapture={setPhoto} />
      </div>

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
        <p className={styles.hint}>Tap the camera to take a Polaroid</p>
      )}
    </section>
  );
}
