// components/GalleryCarousel.tsx
"use client";

import { useRef } from "react";

type Img = { src: string; alt: string };

export default function GalleryCarousel({ images }: { images: Img[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  function scrollBySlides(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;

    // Scroll by ~one slide width
    const firstChild = el.querySelector<HTMLElement>("[data-slide]");
    const step = firstChild ? firstChild.offsetWidth + 12 : 320; // +gap
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <div className="galleryShell">
      <button
        type="button"
        className="galleryArrow galleryArrowLeft"
        onClick={() => scrollBySlides(-1)}
        aria-label="Scroll gallery left"
      >
        <span aria-hidden="true">‹</span>
      </button>

      <div className="galleryCarousel" ref={scrollerRef} role="region" aria-label="Gallery">
        {images.map((img, i) => (
          <div key={`${img.src}-${i}`} className="gallerySlide" data-slide>
            <img src={img.src} alt={img.alt} loading="lazy" />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="galleryArrow galleryArrowRight"
        onClick={() => scrollBySlides(1)}
        aria-label="Scroll gallery right"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
