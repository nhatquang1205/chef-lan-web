"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Thumbnail } from "./Thumbnail";
import { ApiError } from "@/lib/api/client";
import { getMyCourses } from "@/lib/api/myCourses";
import type { MyCourse } from "@/lib/api/types";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { template } from "@/lib/format";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function MyCoursesView({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const auth = useRequireAuth(lang);
  const [courses, setCourses] = useState<MyCourse[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated") {
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
  }, [auth, auth.status]);

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
          <MyCourseCard course={course} lang={lang} dict={dict} />
        </li>
      ))}
    </ul>
  );
}

function MyCourseCard({ course, lang, dict }: { course: MyCourse; lang: Locale; dict: Dictionary }) {
  const expires = course.courseExpiresAt ? new Date(course.courseExpiresAt).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US") : null;

  return (
    <Link
      href={localePath(lang, `/courses/${course.slug}`)}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-beige/15 bg-olive-raised transition-colors hover:border-beige/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Thumbnail src={course.cardImageUrl ?? course.thumbnailUrl} alt="" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 90vw" className="transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-xl leading-snug">{course.title}</h3>
        {expires && (
          <p className="mt-auto pt-2 text-sm text-beige/70">
            {template(dict.account.expires, { date: expires })}
          </p>
        )}
        {course.lessons.length > 0 && (
          <div className="mt-auto pt-2 text-sm text-beige/70">
            <p>{template(dict.account.ownedLessons, { count: course.lessons.length })}</p>
            <ul className="mt-1 list-disc pl-5">
              {course.lessons.map((lesson) => (
                <li key={lesson.id}>{lesson.title}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Link>
  );
}
