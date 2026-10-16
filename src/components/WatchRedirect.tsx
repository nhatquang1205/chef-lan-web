"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import type { Playback } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Old watch links (shared links, viewing history) now open the lesson page with that video selected.
 * The lesson is only known from the playback answer; a video this viewer may not play goes to the course.
 */
export function WatchRedirect({ slug, videoId, lang, dict }: { slug: string; videoId: string; lang: Locale; dict: Dictionary }) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "loading") {
      return;
    }

    let cancelled = false;

    void (async () => {
      let target = localePath(lang, `/courses/${slug}`);

      try {
        const token = await auth.getAccessToken();
        const playback = await apiFetch<Playback>(`/api/v1/videos/${encodeURIComponent(videoId)}/playback`, { token: token ?? undefined });
        target = `${localePath(lang, `/courses/${playback.courseSlug}/lessons/${playback.lessonSlug}`)}?v=${playback.videoId}`;
      } catch {
        // Not playable or unknown: the course page is the closest useful place.
      }

      if (!cancelled) {
        router.replace(target);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, auth.status, slug, videoId, lang, router]);

  return <div className="mx-auto h-96 max-w-5xl animate-pulse px-4 py-10" role="status" aria-label={dict.watch.checkingAccess} />;
}
