/** Marker for word nodes built by `splitTextIntoWordNodes` (scroll-scrub reveal). */
export const SCROLL_REVEAL_WORD = "data-scroll-reveal-word";

export function splitTextIntoWordNodes(
  paragraph: HTMLElement,
  text: string,
  wordClassName: string,
  spanClassName: string
) {
  paragraph.replaceChildren();
  const parts = text.split(/\s+/);
  for (const word of parts) {
    if (!word.trim()) continue;
    const wordEl = document.createElement("div");
    wordEl.setAttribute(SCROLL_REVEAL_WORD, "");
    wordEl.className = wordClassName;
    const span = document.createElement("span");
    span.className = spanClassName;
    span.textContent = word;
    wordEl.appendChild(span);
    paragraph.appendChild(wordEl);
  }
}

/** Staggered word reveal driven by scroll progress 0–1 (cg-navigate-scroll style, reveal phase only). */
export function updateScrollWordReveal(
  progress: number,
  container: HTMLElement,
  rgb: string,
  overlapWords = 15,
  chipAlphaMax = 0.32
) {
  const words = Array.from(
    container.querySelectorAll<HTMLElement>(`[${SCROLL_REVEAL_WORD}]`)
  );
  const totalWords = words.length;
  if (totalWords === 0) return;

  const revealProgress = Math.min(1, Math.max(0, progress));

  words.forEach((word, index) => {
    const wordText = word.querySelector<HTMLElement>("span");
    if (!wordText) return;

    const totalAnimationLength = 1 + overlapWords / totalWords;
    const wordStart = index / totalWords;
    const wordEnd = wordStart + overlapWords / totalWords;
    const timelineScale =
      1 /
      Math.min(
        totalAnimationLength,
        1 + (totalWords - 1) / totalWords + overlapWords / totalWords
      );
    const adjustedStart = wordStart * timelineScale;
    const adjustedEnd = wordEnd * timelineScale;
    const duration = adjustedEnd - adjustedStart;

    const wordProgress =
      revealProgress <= adjustedStart
        ? 0
        : revealProgress >= adjustedEnd
          ? 1
          : (revealProgress - adjustedStart) / duration;

    word.style.opacity = String(wordProgress);

    const backgroundFadeStart = wordProgress >= 0.9 ? (wordProgress - 0.9) / 0.1 : 0;
    const backgroundOpacity = Math.max(0, 1 - backgroundFadeStart);
    word.style.backgroundColor = `rgba(${rgb}, ${backgroundOpacity * chipAlphaMax})`;

    const textRevealThreshold = 0.9;
    const textRevealProgress =
      wordProgress >= textRevealThreshold
        ? (wordProgress - textRevealThreshold) / (1 - textRevealThreshold)
        : 0;
    wordText.style.opacity = String(Math.pow(textRevealProgress, 0.5));
  });
}

export function setScrollWordsFullyVisible(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>(`[${SCROLL_REVEAL_WORD}]`).forEach((word) => {
    word.style.opacity = "1";
    word.style.backgroundColor = "transparent";
    word.querySelectorAll<HTMLElement>("span").forEach((s) => {
      s.style.opacity = "1";
    });
  });
}
