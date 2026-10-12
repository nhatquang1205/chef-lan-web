"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CourseCard } from "./CourseCard";
import { getMyCourses } from "@/lib/api/myCourses";
import type { MyCourse } from "@/lib/api/types";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
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
        const result = await getMyCourses();
        if (!cancelled) setCourses(result);
      } catch {
        if (!cancelled) setFailed(true);
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
          <CourseCard course={course} lang={lang} dict={dict} />
        </li>
      ))}
    </ul>
  );
}
