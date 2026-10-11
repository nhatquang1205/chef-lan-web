"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useMemo, useState } from "react";

interface CarouselProps {
  children: React.ReactNode[];
  label: string;
  /** Tailwind classes sizing each slide, e.g. "basis-4/5 sm:basis-1/2 lg:basis-1/4". */
  slideClassName: string;
  gapClassName?: string;
  autoplayMs?: number;
  loop?: boolean;
  prevLabel: string;
  nextLabel: string;
  goToLabel?: string;
  dots?: boolean;
  arrows?: boolean;
}

/** Headless Embla, styled here. Used for both the hero and the category rows. */
export function Carousel({
  children,
  label,
  slideClassName,
  gapClassName = "-ml-4",
  autoplayMs,
  loop = false,
  prevLabel,
  nextLabel,
  goToLabel = "",
  dots = false,
  arrows = true,
}: CarouselProps) {
  // Autoplay is skipped entirely for people who ask for reduced motion.
  const plugins = useMemo(() => {
    if (!autoplayMs || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return [];
    }

    return [Autoplay({ delay: autoplayMs, stopOnInteraction: false, stopOnMouseEnter: true })];
  }, [autoplayMs]);

  const [viewport, embla] = useEmblaCarousel({ loop, align: "start", containScroll: "trimSnaps" }, plugins);
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const refresh = useCallback(() => {
    if (!embla) {
      return;
    }

    setSnaps(embla.scrollSnapList());
    setSelected(embla.selectedScrollSnap());
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) {
      return;
    }

    // Initial read is deferred a frame: the state is mirrored from an external system (Embla),
    // and doing it synchronously in the effect would re-render before the first paint.
    const frame = requestAnimationFrame(refresh);
    embla.on("select", refresh).on("reInit", refresh);

    return () => {
      cancelAnimationFrame(frame);
      embla.off("select", refresh).off("reInit", refresh);
    };
  }, [embla, refresh]);

  const showArrows = arrows && snaps.length > 1;

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className="relative">
      <div ref={viewport} className="overflow-hidden">
        <div className={`flex ${gapClassName}`}>
          {children.map((child, index) => (
            <div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${children.length}`}
              className={`min-w-0 shrink-0 grow-0 pl-4 ${slideClassName}`}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            aria-label={prevLabel}
            disabled={!loop && !canPrev}
            onClick={() => embla?.scrollPrev()}
            className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-olive/85 text-beige ring-1 ring-beige/30 hover:bg-olive disabled:opacity-30 sm:flex"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={nextLabel}
            disabled={!loop && !canNext}
            onClick={() => embla?.scrollNext()}
            className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-olive/85 text-beige ring-1 ring-beige/30 hover:bg-olive disabled:opacity-30 sm:flex"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {dots && snaps.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {snaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${goToLabel} ${index + 1}`}
              aria-current={index === selected}
              onClick={() => embla?.scrollTo(index)}
              className={`h-2.5 rounded-full transition-all ${index === selected ? "w-8 bg-beige" : "w-2.5 bg-beige/35 hover:bg-beige/60"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
