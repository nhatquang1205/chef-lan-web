import Link from "next/link";
import { CoursePrice } from "./CoursePrice";
import { Thumbnail } from "./Thumbnail";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDuration } from "@/lib/format";
import type { CourseListItem } from "@/lib/api/types";
import type { PriceDict } from "@/lib/priceDict";

export function CourseCard({
  course,
  lang,
  dict,
}: {
  course: CourseListItem;
  lang: Locale;
  dict: Pick<Dictionary, "duration"> & Pick<PriceDict, "common"> & { card: Pick<Dictionary["card"], "lessons" | "owned"> };
}) {
  const lessonCount = course.totalLessonCount ?? course.lessonCount;
  const durationSeconds = course.totalDurationSecondsWithIncluded ?? course.totalDurationSeconds;

  return (
    <Link
      href={localePath(lang, `/courses/${course.slug}`)}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-beige/15 bg-olive-raised transition-colors hover:border-beige/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Thumbnail
          src={course.cardImageUrl ?? course.thumbnailUrl}
          alt=""
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 80vw"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-xl leading-snug text-beige">{course.title}</h3>
        {course.subtitle && <p className="line-clamp-2 text-sm text-beige/70">{course.subtitle}</p>}

        <p className="mt-auto pt-2 text-sm text-beige/60">
          {lessonCount} {dict.card.lessons}
          {durationSeconds > 0 && ` · ${formatDuration(durationSeconds, dict)}`}
        </p>

        <CoursePrice course={course} dict={dict} />
      </div>
    </Link>
  );
}
