"use client";

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

function useOwns(lessonId: number, included: boolean): boolean {
  const access = useContext(AccessContext);
  return (access.hasCourseAccess && included) || access.lessonIds.includes(lessonId);
}

/** "Owned" marker on a lesson the customer has. */
export function OwnedBadge({ lessonId, included, dict }: { lessonId: number; included: boolean; dict: Dictionary }) {
  return useOwns(lessonId, included) ? (
    <span className="rounded border border-beige/50 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">
      {dict.course.owned}
    </span>
  ) : null;
}
