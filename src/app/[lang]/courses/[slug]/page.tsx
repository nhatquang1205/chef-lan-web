import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CourseAccessProvider, OwnedBadge } from "@/components/CourseAccess";
import { Thumbnail } from "@/components/Thumbnail";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getCourse } from "@/lib/api/catalog";
import { formatDuration, formatVnd, template } from "@/lib/format";

export default function CoursePage({ params }: PageProps<"/[lang]/courses/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-5xl animate-pulse px-4 py-10" aria-hidden />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[lang]/courses/[slug]">["params"] }) {
  const [lang, dict, { slug }] = await Promise.all([getLocale(), getDictionary(), params]);

  let course;

  try {
    course = await getCourse(slug);
  } catch {
    return <p role="alert" className="mx-auto max-w-5xl px-4 py-24 text-center text-beige/70">{dict.common.error}</p>;
  }

  if (!course) {
    notFound();
  }

  const access =
    course.accessDurationDays == null
      ? dict.course.accessLifetime
      : template(dict.course.accessDays, { days: course.accessDurationDays });

  const includedLessons = course.lessons.filter((l) => l.includedInCourse);
  const addonLessons = course.lessons.filter((l) => !l.includedInCourse);
  const learnItems = (course.whatYouWillLearn ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
  const level = dict.level[course.level];
  const facts = [
    level && { label: dict.course.level, value: level },
    { label: dict.course.lessons, value: String(course.lessonCount) },
    course.totalDurationSeconds > 0 && { label: dict.course.duration, value: formatDuration(course.totalDurationSeconds, dict) },
    { label: dict.course.access, value: access },
  ].filter((fact): fact is { label: string; value: string } => !!fact);

  const renderLesson = (lesson: (typeof course.lessons)[number], index: number, addon: boolean) => (
    <li key={lesson.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
      <span className="hidden size-9 shrink-0 items-center justify-center rounded-full border border-beige/25 font-display text-beige/80 sm:flex">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg">
            <span className="text-beige/55 sm:hidden">{index + 1}. </span>
            {lesson.title}
          </h3>
          <OwnedBadge lessonId={lesson.id} included={lesson.includedInCourse} dict={dict} />
        </div>
        <p className="mt-1 text-sm text-beige/60">
          {lesson.videos.length} {dict.course.videos}
          {lesson.durationSeconds > 0 && ` · ${formatDuration(lesson.durationSeconds, dict)}`}
          {lesson.videos.some((v) => v.isFree) && ` · ${dict.common.free}`}
        </p>
        {lesson.priceDisplay && (
          <p className="mt-1 text-sm text-beige/75">
            {template(dict.course.lessonPrice, { price: lesson.priceDisplay })}
            {addon && <span className="text-beige/55"> · {dict.course.addonsTitle}</span>}
          </p>
        )}
      </div>
      <Link
        href={localePath(lang, `/courses/${course.slug}/lessons/${lesson.slug}`)}
        className="self-start rounded border border-beige/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-beige hover:border-beige hover:bg-olive-raised sm:self-center"
      >
        {dict.course.details}
      </Link>
    </li>
  );

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <title>{course.title}</title>
      {course.metaDescription && <meta name="description" content={course.metaDescription} />}

      <Link href={localePath(lang, "/courses")} className="text-sm uppercase tracking-widest text-beige/70 hover:text-beige">
        ← {dict.course.back}
      </Link>

      <div className="mt-6 grid items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className="order-2 md:order-1">
          {course.categories.length > 0 && (
            <p className="text-sm uppercase tracking-widest text-beige/60">{course.categories.map((c) => c.name).join(" · ")}</p>
          )}
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">{course.title}</h1>
          {course.subtitle && <p className="mt-4 text-lg text-beige/85">{course.subtitle}</p>}

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-beige/15 bg-beige/15">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-olive px-3 py-3">
                <dt className="text-xs uppercase tracking-widest text-beige/55">{fact.label}</dt>
                <dd className="mt-1 font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-beige/55">{dict.course.price}</p>
              <p className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold">{course.priceDisplay}</span>
                {course.compareAtPriceVnd != null && course.compareAtPriceVnd > course.priceVnd && (
                  <s className="text-beige/50">{formatVnd(course.compareAtPriceVnd)}</s>
                )}
              </p>
            </div>
            <p className="rounded bg-terracotta px-4 py-2 text-sm text-beige">{dict.course.buyNote}</p>
          </div>
        </div>

        <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-xl border border-beige/15 md:order-2">
          <Thumbnail src={course.thumbnailUrl} alt="" priority sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
      </div>

      {(course.description || learnItems.length > 0) && (
        <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-12">
          {course.description && (
            <section>
              <h2 className="font-display text-2xl">{dict.course.about}</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-beige/90">{course.description}</p>
            </section>
          )}
          {learnItems.length > 0 && (
            <section className={course.description ? "" : "md:col-span-2"}>
              <h2 className="font-display text-2xl">{dict.course.whatYouWillLearn}</h2>
              <ul className="mt-3 space-y-2 rounded-lg border border-beige/15 bg-olive-raised/50 p-5">
                {learnItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mt-1 shrink-0 text-terracotta-hover" aria-hidden>
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                    <span className="text-beige/90">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <section className="mt-14">
        <h2 className="font-display text-2xl">{dict.course.outline}</h2>
        <p className="mt-1 text-sm text-beige/60">
          {template(dict.course.lessonsCount, { count: includedLessons.length })}
          {course.totalDurationSeconds > 0 && ` · ${formatDuration(course.totalDurationSeconds, dict)}`}
        </p>
        <CourseAccessProvider slug={course.slug}>
          <ol className="mt-4 divide-y divide-beige/15 rounded-lg border border-beige/15">
            {includedLessons.map((lesson, index) => renderLesson(lesson, index, false))}
          </ol>
          {addonLessons.length > 0 && (
            <>
              <h3 className="mt-10 font-display text-xl">{dict.course.addonsTitle}</h3>
              <p className="mt-1 text-sm text-beige/70">{dict.course.addonsNote}</p>
              <ol className="mt-3 divide-y divide-beige/15 rounded-lg border border-beige/15">
                {addonLessons.map((lesson, index) => renderLesson(lesson, index, true))}
              </ol>
            </>
          )}
        </CourseAccessProvider>
      </section>
    </article>
  );
}
