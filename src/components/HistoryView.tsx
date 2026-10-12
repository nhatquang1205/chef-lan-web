"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clearHistory, readHistory, type HistoryEntry } from "@/lib/history";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { template } from "@/lib/format";

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
    <div>
      <ul className="space-y-3">
        {entries.map((entry) => {
          const percent = entry.durationSeconds > 0 ? Math.min(100, Math.round((entry.positionSeconds / entry.durationSeconds) * 100)) : 0;

          return (
            <li key={entry.videoId}>
              <Link
                href={localePath(lang, `/courses/${entry.courseSlug}/watch/${entry.videoId}`)}
                className="block rounded-lg border border-beige/15 bg-olive-raised p-4 transition-colors hover:border-beige/40"
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
                  aria-label={template(dict.account.watched, { percent })}
                  className="mt-3 h-1.5 overflow-hidden rounded bg-beige/15"
                >
                  <div className="h-full bg-beige" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-2 flex justify-between text-sm text-beige/70">
                  <span>{template(dict.account.watched, { percent })}</span>
                  <span>{dict.account.resume}</span>
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => {
          clearHistory(key);
          setVersion((value) => value + 1);
        }}
        className="mt-6 rounded border border-beige/40 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-beige hover:bg-beige/10"
      >
        {dict.account.clearHistory}
      </button>
    </div>
  );
}
