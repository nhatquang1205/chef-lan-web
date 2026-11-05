"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { template } from "@/lib/format";

const COUNTDOWN_SECONDS = 5;

/** "Up next" banner shown when a video ends: counts down, then goes on unless cancelled. */
export function UpNext({ title, go, cancel, dict }: { title: string; go: () => void; cancel: () => void; dict: Dictionary }) {
  const [left, setLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (left <= 0) {
      go();
      return;
    }

    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left, go]);

  return (
    <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-beige/20 bg-olive-raised px-4 py-3 text-sm">
      <p>{template(dict.lesson.upNext, { title, seconds: left })}</p>
      <div className="flex gap-2">
        <button type="button" onClick={go} className="rounded bg-terracotta px-3 py-1.5 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover">
          {dict.lesson.playNow}
        </button>
        <button type="button" onClick={cancel} className="rounded border border-beige/40 px-3 py-1.5 font-semibold uppercase tracking-widest hover:bg-beige/10">
          {dict.lesson.cancel}
        </button>
      </div>
    </div>
  );
}
