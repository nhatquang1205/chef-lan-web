"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { Playback } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { template } from "@/lib/format";
import { readHistory, saveProgress } from "@/lib/history";

type State =
  | { kind: "loading" }
  | { kind: "ok"; playback: Playback; startAt: number }
  | { kind: "forbidden" }
  | { kind: "error" };

/**
 * One video of the lesson page. The signed link is asked for from the browser with the customer's token,
 * so owners get the full video; the API decides what plays.
 */
export function LessonVideo({
  publicId,
  courseHref,
  loginNext,
  lang,
  dict,
}: {
  publicId: string;
  courseHref: string;
  /** Where to come back to after signing in. */
  loginNext: string;
  lang: Locale;
  dict: Dictionary;
}) {
  const auth = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (auth.status === "loading") {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await auth.getAccessToken();
        const playback = await apiFetch<Playback>(`/api/v1/videos/${encodeURIComponent(publicId)}/playback`, { token: token ?? undefined });

        if (cancelled) {
          return;
        }

        const saved = auth.user ? readHistory(`${auth.user.actor}-${auth.user.id}`).find((item) => item.videoId === playback.videoId) : undefined;
        // Near the end, start over rather than resume into the credits.
        const startAt = saved && saved.positionSeconds < playback.durationSeconds - 5 ? Math.floor(saved.positionSeconds) : 0;

        setState({ kind: "ok", playback, startAt });
      } catch (error) {
        if (!cancelled) {
          setState(error instanceof ApiError && (error.status === 403 || error.status === 404) ? { kind: "forbidden" } : { kind: "error" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, auth.status, publicId]);

  if (state.kind !== "ok") {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border border-beige/15 bg-black/40 p-6 text-center">
        {state.kind === "loading" && <p className="text-beige/70">{dict.watch.loadingPlayer}</p>}
        {state.kind === "error" && <p role="alert" className="text-beige/70">{dict.common.error}</p>}
        {state.kind === "forbidden" && (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <p className="font-display text-2xl">{dict.lesson.lockedVideoTitle}</p>
            <p className="max-w-md text-beige/75">{dict.lesson.lockedVideoText}</p>
            {auth.status !== "authenticated" && (
              <p className="text-sm text-beige/75">
                {dict.watch.signInHint}{" "}
                <Link
                  href={`${localePath(lang, "/login")}?next=${encodeURIComponent(loginNext)}`}
                  className="font-semibold text-beige underline underline-offset-4"
                >
                  {dict.watch.signIn}
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  const { playback, startAt } = state;
  const historyKey = auth.user ? `${auth.user.actor}-${auth.user.id}` : null;

  return (
    <div role="region" aria-label={dict.watch.playerLabel}>
      <VideoPlayer
        key={playback.videoId}
        url={playback.url}
        title={playback.title}
        freeTillSeconds={playback.freeTillSeconds ?? null}
        courseHref={courseHref}
        dict={dict}
        startAt={startAt}
        onProgress={
          historyKey
            ? (seconds) =>
                saveProgress(historyKey, {
                  videoId: playback.videoId,
                  courseSlug: playback.courseSlug,
                  courseTitle: playback.courseTitle,
                  lessonTitle: playback.lessonTitle,
                  title: playback.title,
                  positionSeconds: seconds,
                  durationSeconds: playback.durationSeconds,
                })
            : undefined
        }
      />
      {playback.freeTillSeconds != null && (
        <p className="mt-3 rounded bg-terracotta/30 px-3 py-2 text-sm">
          {template(dict.watch.previewNotice, { seconds: playback.freeTillSeconds })}
        </p>
      )}
      {playback.description && <p className="mt-4 whitespace-pre-line text-beige/85">{playback.description}</p>}
    </div>
  );
}
