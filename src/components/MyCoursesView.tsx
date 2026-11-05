"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Thumbnail } from "./Thumbnail";
import { ApiError } from "@/lib/api/client";
import { getMyCourses } from "@/lib/api/myCourses";
import type { MyCourse } from "@/lib/api/types";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { template } from "@/lib/format";
import { formatClock, historyHref, readHistory, type HistoryEntry } from "@/lib/history";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function MyCoursesView({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const auth = useRequireAuth(lang);
  const [courses, setCourses] = useState<MyCourse[] | null>(null);
  const [failed, setFailed] = useState(false);
  const isStaff = auth.user?.actor === "Staff";
  const key = auth.user ? `${auth.user.actor}-${auth.user.id}` : null;
  // The most recently watched video of each course, from the local watch history.
  const lastWatched = useMemo(() => {
    const byCourse = new Map<string, HistoryEntry>();

    for (const entry of key ? readHistory(key) : []) {
      if (!byCourse.has(entry.courseSlug)) {
        byCourse.set(entry.courseSlug, entry);
      }
    }

    return byCourse;
  }, [key]);

  useEffect(() => {
    // An admin login has no library (the endpoint is customer-only): say so instead of asking.
    if (auth.status !== "authenticated" || isStaff) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await auth.getAccessToken();

        if (!token) {
          return;
        }

        const result = await getMyCourses(token);
        if (!cancelled) setCourses(result);
      } catch (error) {
        // An admin login has no library: the endpoint is customer-only.
        if (error instanceof ApiError && error.status === 403) {
          if (!cancelled) setCourses([]);
        } else if (!cancelled) {
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, auth.status, isStaff]);

  if (isStaff) {
    return <p role="status" className="text-beige/75">{dict.account.staffNoLibrary}</p>;
  }

  if (failed) {
    return <p role="alert" className="text-beige/70">{dict.common.error}</p>;
  }

  if (!courses) {
    return <div className="h-64 animate-pulse rounded-lg bg-olive-raised" role="status" aria-label={dict.account.loading} />;
  }

  if (courses.length === 0) {
    return (
      <div>
        <p className="text-beige/75">{dict.account.myCoursesEmpty}</p>
        <Link href={localePath(lang, "/courses")} className="mt-6 inline-block rounded bg-terracotta px-5 py-2 text-sm font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover">
          {dict.account.browseCourses}
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <li key={course.slug}>
          <MyCourseCard course={course} lang={lang} dict={dict} last={lastWatched.get(course.slug)} />
        </li>
      ))}
    </ul>
  );
}

function MyCourseCard({ course, lang, dict, last }: { course: MyCourse; lang: Locale; dict: Dictionary; last?: HistoryEntry }) {
  const expires = course.courseExpiresAt ? new Date(course.courseExpiresAt).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US") : null;
  const percent = last && last.durationSeconds > 0 ? Math.min(100, Math.round((last.positionSeconds / last.durationSeconds) * 100)) : 0;

  return (
    // The title link is stretched over the card; the Continue link sits above it.
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-beige/15 bg-olive-raised transition-colors hover:border-beige/40">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Thumbnail src={course.cardImageUrl ?? course.thumbnailUrl} alt="" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 90vw" className="transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-xl leading-snug">
          <Link href={localePath(lang, `/courses/${course.slug}`)} className="after:absolute after:inset-0">
            {course.title}
          </Link>
        </h3>
        {expires && <p className="text-sm text-beige/70">{template(dict.account.expires, { date: expires })}</p>}
        {course.lessons.length > 0 && (
          <div className="text-sm text-beige/70">
            <p>{template(dict.account.ownedLessons, { count: course.lessons.length })}</p>
            <ul className="mt-1 list-disc pl-5">
              {course.lessons.map((lesson) => (
                <li key={lesson.id}>{lesson.title}</li>
              ))}
            </ul>
          </div>
        )}
        {last && (
          <div className="mt-auto pt-3">
            <p className="truncate text-sm text-beige/80">{last.title}</p>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${formatClock(last.positionSeconds)} / ${formatClock(last.durationSeconds)}`}
              className="mt-2 h-1.5 overflow-hidden rounded bg-beige/15"
            >
              <div className="h-full bg-beige" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm text-beige/70">
                {formatClock(last.positionSeconds)} / {formatClock(last.durationSeconds)}
              </span>
              <Link
                href={historyHref(lang, last)}
                className="relative z-10 rounded bg-terracotta px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover"
              >
                {dict.account.continue}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
