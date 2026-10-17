"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { CourseAccess as CourseAccessData } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Dictionary } from "@/i18n/dictionaries";

const NONE: CourseAccessData = { hasCourseAccess: false, lessonIds: [] };

interface AccessState {
  access: CourseAccessData;
  /** False while a signed-in viewer's access is still being fetched, so nothing flashes as "not owned". */
  ready: boolean;
}

const AccessContext = createContext<AccessState>({ access: NONE, ready: true });

/**
 * What the signed-in viewer can open in this course, fetched from the browser (login tokens live in the
 * browser, so the server-rendered page cannot know). A customer gets what they own; a STAFF account gets
 * everything published (the API answers that for staff tokens). Used only to unlock the outline: it changes
 * what buttons show, never what plays — the playback endpoint decides that. Anonymous visitors and any
 * failure mean "owns nothing", so the outline falls back to the public view.
 */
export function CourseAccessProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const auth = useAuth();
  const [access, setAccess] = useState<CourseAccessData>(NONE);
  const [loaded, setLoaded] = useState(false);
  const isSignedIn = auth.status === "authenticated";

  useEffect(() => {
    if (!isSignedIn) {
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
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setAccess(NONE);
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, slug, auth]);

  return <AccessContext.Provider value={isSignedIn ? { access, ready: loaded } : { access: NONE, ready: auth.status !== "loading" }}>{children}</AccessContext.Provider>;
}

function useOwns(lessonId: number, included: boolean): boolean | null {
  const { access, ready } = useContext(AccessContext);
  return ready ? (access.hasCourseAccess && included) || access.lessonIds.includes(lessonId) : null;
}

/** Marks a lesson the viewer does not own yet; owned lessons carry no marker. */
export function NotOwnedBadge({ lessonId, included, dict }: { lessonId: number; included: boolean; dict: Dictionary }) {
  return useOwns(lessonId, included) === false ? (
    <span className="rounded border border-beige/50 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">
      {dict.course.notOwned}
    </span>
  ) : null;
}

/** The "contact chef Lan to enrol" note, hidden once the customer owns the whole course. */
export function BuyNote({ dict }: { dict: Dictionary }) {
  const { access } = useContext(AccessContext);
  return access.hasCourseAccess ? null : <p className="rounded bg-terracotta px-4 py-2 text-sm text-beige">{dict.course.buyNote}</p>;
}
