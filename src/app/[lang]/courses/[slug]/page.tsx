import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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

  return (
    <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <title>{course.title}</title>
      {course.metaDescription && <meta name="description" content={course.metaDescription} />}

      <Link href={localePath(lang, "/courses")} className="text-sm uppercase tracking-widest text-beige/70 hover:text-beige">
        ← {dict.course.back}
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[3fr_2fr]">
        <div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{course.title}</h1>
          {course.subtitle && <p className="mt-3 text-xl text-beige/85">{course.subtitle}</p>}
          <p className="mt-4 text-beige/65">
            {dict.level[course.level] && `${dict.level[course.level]} · `}
            {course.lessonCount} {dict.card.lessons}
            {course.totalDurationSeconds > 0 && ` · ${formatDuration(course.totalDurationSeconds, dict)}`}
          </p>
        </div>

        <aside className="rounded-lg border border-beige/15 bg-olive-raised p-5">
          <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded">
            <Thumbnail src={course.thumbnailUrl} alt="" priority sizes="(min-width: 768px) 40vw, 100vw" />
          </div>
          <p className="text-sm uppercase tracking-widest text-beige/65">{dict.course.price}</p>
          <p className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold">{course.priceDisplay}</span>
            {course.compareAtPriceVnd != null && course.compareAtPriceVnd > course.priceVnd && (
              <s className="text-beige/50">{formatVnd(course.compareAtPriceVnd)}</s>
            )}
          </p>
          <p className="mt-3 text-sm text-beige/75">
            {dict.course.access}: {access}
          </p>
          <p className="mt-4 rounded bg-terracotta/30 px-3 py-2 text-sm">{dict.course.buyNote}</p>
        </aside>
      </div>

      {course.description && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">{dict.course.about}</h2>
          <p className="mt-3 whitespace-pre-line text-beige/90">{course.description}</p>
        </section>
      )}

      {course.whatYouWillLearn && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">{dict.course.whatYouWillLearn}</h2>
          <p className="mt-3 whitespace-pre-line text-beige/90">{course.whatYouWillLearn}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl">{dict.course.outline}</h2>
        <ol className="mt-4 divide-y divide-beige/15 rounded-lg border border-beige/15">
          {course.lessons.map((lesson, index) => (
            <li key={lesson.id}>
              <details open={index === 0} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 hover:bg-olive-raised">
                  <span>
                    <span className="text-beige/55">{index + 1}. </span>
                    {lesson.title}
                  </span>
                  <span className="shrink-0 text-sm text-beige/60">
                    {lesson.videos.length} {dict.course.videos}
                    {lesson.durationSeconds > 0 && ` · ${formatDuration(lesson.durationSeconds, dict)}`}
                  </span>
                </summary>

                <ul className="space-y-2 bg-olive-raised/60 px-4 py-3">
                  {/* whitespace-pre-line keeps the author's line breaks (e.g. one recipe step per line). */}
                  {lesson.description && (
                    <li className="whitespace-pre-line text-sm text-beige/70">{lesson.description}</li>
                  )}
                  {lesson.videos.map((video) => (
                    <li key={video.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        {video.title}
                        {video.isFree && (
                          <span className="rounded bg-terracotta px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">
                            {dict.common.free}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-4 text-beige/65">
                        {video.freeTillSeconds != null && <span>{template(dict.course.freeUntil, { seconds: video.freeTillSeconds })}</span>}
                        {video.durationSeconds > 0 && <span>{formatDuration(video.durationSeconds, dict)}</span>}
                        {video.url && (
                          <a href={video.url} target="_blank" rel="noopener noreferrer" className="font-semibold uppercase tracking-widest text-beige underline underline-offset-4">
                            {dict.course.watchFree}
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
