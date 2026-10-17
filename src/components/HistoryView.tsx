"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { readHistory, removeFromHistory, type HistoryEntry } from "@/lib/history";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function HistoryView({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const auth = useRequireAuth(lang);
  const [version, setVersion] = useState(0);
  const key = auth.user ? `${auth.user.actor}-${auth.user.id}` : null;
  // The auth user only exists after hydration, so reading localStorage here cannot mismatch the server HTML.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const entries: HistoryEntry[] | null = useMemo(() => (key ? readHistory(key) : null), [key, version]);

  if (!entries || !key) {
    return <div className="h-40 animate-pulse rounded-lg bg-olive-raised" role="status" aria-label={dict.account.loading} />;
  }

  if (entries.length === 0) {
    return <p className="text-beige/75">{dict.account.historyEmpty}</p>;
  }

  return (
    <ul className="space-y-3">
        {entries.map((entry) => {
          const percent = entry.durationSeconds > 0 ? Math.min(100, Math.round((entry.positionSeconds / entry.durationSeconds) * 100)) : 0;

          return (
            <li key={entry.videoId} className="relative">
              <Link
                href={localePath(lang, `/courses/${entry.courseSlug}/watch/${entry.videoId}`)}
                className="block rounded-lg border border-beige/15 bg-olive-raised p-4 pr-12 transition-colors hover:border-beige/40"
              >
                <p className="font-display text-xl leading-snug">{entry.title}</p>
                <p className="mt-1 text-sm text-beige/70">
                  {entry.courseTitle} · {entry.lessonTitle}
                </p>
                <div
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${clock(entry.positionSeconds)} / ${clock(entry.durationSeconds)}`}
                  className="mt-3 h-1.5 overflow-hidden rounded bg-beige/15"
                >
                  <div className="h-full bg-beige" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-2 flex justify-between text-sm text-beige/70">
                  <span>{clock(entry.positionSeconds)} / {clock(entry.durationSeconds)}</span>
                  <span>{dict.account.resume}</span>
                </p>
              </Link>
              <button
                type="button"
                aria-label={dict.account.removeEntry}
                title={dict.account.removeEntry}
                onClick={() => {
                  removeFromHistory(key, entry.videoId);
                  setVersion((value) => value + 1);
                }}
                className="absolute right-3 top-3 rounded p-1.5 text-beige/70 hover:bg-beige/10 hover:text-beige"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          );
        })}
    </ul>
  );
}
