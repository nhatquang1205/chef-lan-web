"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { CourseAccess as CourseAccessData } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Dictionary } from "@/i18n/dictionaries";

const NONE: CourseAccessData = { hasCourseAccess: false, lessonIds: [] };

const AccessContext = createContext<CourseAccessData>(NONE);

/**
 * What the signed-in CUSTOMER owns in this course, fetched from the browser (login tokens live in the
 * browser, so the server-rendered page cannot know). Used only to unlock the outline: it changes what
 * buttons show, never what plays — the playback endpoint decides that. Anonymous visitors, staff and
 * any failure all mean "owns nothing", so the outline falls back to the public view.
 */
export function CourseAccessProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const auth = useAuth();
  const [access, setAccess] = useState<CourseAccessData>(NONE);
  const isCustomer = auth.status === "authenticated" && auth.user?.actor === "Customer";

  useEffect(() => {
    if (!isCustomer) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await auth.getAccessToken();
        const result = token
          ? await apiFetch<CourseAccessData>(`/api/v1/courses/${encodeURIComponent(slug)}/access`, { token })
          : NONE;

        if (!cancelled) {
          setAccess(result);
        }
      } catch {
        if (!cancelled) {
          setAccess(NONE);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isCustomer, slug, auth]);

  return <AccessContext.Provider value={isCustomer ? access : NONE}>{children}</AccessContext.Provider>;
}

function useOwns(lessonId: number): boolean {
  const access = useContext(AccessContext);
  return access.hasCourseAccess || access.lessonIds.includes(lessonId);
}

/** "Owned" marker on a lesson the customer has. */
export function OwnedBadge({ lessonId, dict }: { lessonId: number; dict: Dictionary }) {
  return useOwns(lessonId) ? (
    <span className="rounded border border-beige/50 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">
      {dict.course.owned}
    </span>
  ) : null;
}

/**
 * The button for one video in the outline. Owners get WATCH VIDEO; otherwise a free video is WATCH VIDEO
 * (no limit) or WATCH PREVIEW (limited), and a paid one shows a lock with no link.
 */
export function VideoAction({
  href,
  lessonId,
  isFree,
  limited,
  dict,
}: {
  href: string;
  lessonId: number;
  isFree: boolean;
  limited: boolean;
  dict: Dictionary;
}) {
  const owned = useOwns(lessonId);

  if (owned || isFree) {
    return (
      <Link
        href={href}
        className="rounded bg-terracotta px-3 py-1 text-xs font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover"
      >
        {owned || !limited ? dict.course.watchVideo : dict.course.watchPreview}
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      {dict.course.locked}
    </span>
  );
}
