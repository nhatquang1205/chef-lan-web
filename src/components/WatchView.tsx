"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "error" };

/**
 * The watch page body. Playback is asked for FROM THE BROWSER, with the customer's token when there is
 * one: login tokens live in the browser, so a server-side fetch could never prove who is watching, and
 * a customer who owns the course or lesson would be shown the locked page. The API decides what plays.
 */
export function WatchView({
  slug,
  videoId,
  lang,
  dict,
}: {
  slug: string;
  videoId: string;
  lang: Locale;
  dict: Dictionary;
}) {
  const auth = useAuth();
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const signedIn = auth.status === "authenticated";
  const courseHref = localePath(lang, `/courses/${slug}`);

  useEffect(() => {
    // Wait until the stored session has been read; asking earlier would always look anonymous.
    if (auth.status === "loading") {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await auth.getAccessToken();
        const playback = await apiFetch<Playback>(`/api/v1/videos/${encodeURIComponent(videoId)}/playback`, { token: token ?? undefined });

        if (cancelled) {
          return;
        }

        // One canonical URL: the course slug comes from the API, not from whatever was typed.
        if (playback.courseSlug !== slug) {
          router.replace(localePath(lang, `/courses/${playback.courseSlug}/watch/${playback.videoId}`));
          return;
        }

        const saved = auth.user ? readHistory(`${auth.user.actor}-${auth.user.id}`).find((item) => item.videoId === playback.videoId) : undefined;
        // Near the end, start over rather than resume into the credits.
        const startAt = saved && saved.positionSeconds < playback.durationSeconds - 5 ? Math.floor(saved.positionSeconds) : 0;

        setState({ kind: "ok", playback, startAt });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          setState({ kind: "not_found" });
        } else if (error instanceof ApiError && error.status === 403) {
          setState({ kind: "forbidden" });
        } else {
          setState({ kind: "error" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, auth.status, videoId, slug, lang, router]);

  if (state.kind === "loading") {
    return <div className="mx-auto h-96 max-w-5xl animate-pulse px-4 py-10" role="status" aria-label={dict.watch.checkingAccess} />;
  }

  if (state.kind === "not_found") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-5xl">{dict.common.notFoundTitle}</h1>
        <p className="mt-4 text-beige/75">{dict.common.notFoundText}</p>
        <Link href={courseHref} className="mt-8 inline-block rounded bg-terracotta px-6 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover">
          {dict.watch.backToCourse}
        </Link>
      </div>
    );
  }

  if (state.kind === "forbidden") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">{dict.watch.notFreeTitle}</h1>
        <p className="mt-4 text-beige/75">{dict.watch.notFreeText}</p>
        {!signedIn && (
          <p className="mt-4 text-beige/75">
            {dict.watch.signInHint}{" "}
            <Link
              href={`${localePath(lang, "/login")}?next=${encodeURIComponent(localePath(lang, `/courses/${slug}/watch/${videoId}`))}`}
              className="font-semibold text-beige underline underline-offset-4"
            >
              {dict.watch.signIn}
            </Link>
          </p>
        )}
        <Link href={courseHref} className="mt-8 inline-block rounded bg-terracotta px-6 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover">
          {dict.watch.backToCourse}
        </Link>
      </div>
    );
  }

  if (state.kind === "error") {
    return <p role="alert" className="mx-auto max-w-5xl px-4 py-24 text-center text-beige/70">{dict.common.error}</p>;
  }

  const { playback, startAt } = state;
  const historyKey = auth.user ? `${auth.user.actor}-${auth.user.id}` : null;

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <title>{playback.title}</title>

      <Link href={courseHref} className="text-sm uppercase tracking-widest text-beige/70 hover:text-beige">
        ← {playback.courseTitle}
      </Link>

      <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">{playback.title}</h1>
      <p className="mt-1 text-beige/65">
        {dict.watch.lesson}: {playback.lessonTitle}
      </p>

      <div className="mt-6" role="region" aria-label={dict.watch.playerLabel}>
        <VideoPlayer
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
      </div>

      {playback.freeTillSeconds != null && (
        <p className="mt-4 rounded bg-terracotta/30 px-3 py-2 text-sm">
          {template(dict.watch.previewNotice, { seconds: playback.freeTillSeconds })}
        </p>
      )}

      {playback.description && <p className="mt-6 whitespace-pre-line text-beige/90">{playback.description}</p>}
    </article>
  );
}
