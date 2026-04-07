"use client";

import { useEffect, useState } from "react";

type GalleryItem = {
  url: string;
  alt: string;
};

type ProjectGalleryLightboxProps = {
  items: GalleryItem[];
};

export default function ProjectGalleryLightbox({
  items,
}: ProjectGalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex]);

  const activeItem = activeIndex !== null ? items[activeIndex] : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, index) => (
          <button
            key={`${item.url}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="rounded-[12px] overflow-hidden bg-transparent border border-black/5 text-left cursor-zoom-in transition-transform hover:scale-[1.01]"
          >
            <img
              src={item.url}
              alt={item.alt}
              className="block w-full h-auto object-contain"
            />
          </button>
        ))}
      </div>

      {activeItem && (
        <div
          className="fixed inset-0 z-[2000] bg-black/88 backdrop-blur-[2px] p-4 sm:p-8"
          onClick={() => setActiveIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen gallery image"
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <img
              src={activeItem.url}
              alt={activeItem.alt}
              className="max-h-full max-w-full object-contain"
              onClick={(event) => event.stopPropagation()}
            />

            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white backdrop-blur-md transition hover:bg-white/20"
              aria-label="Close fullscreen image"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
