import Link from "next/link";
import { Carousel } from "@/components/Carousel";
import { CourseCard } from "@/components/CourseCard";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CourseListItem } from "@/lib/api/types";

/** A row of courses on the home page. */
export function CategorySection({
  id,
  title,
  href,
  linkLabel,
  courses,
  lang,
  dict,
}: {
  id: string;
  title: string;
  href: string;
  linkLabel: string;
  courses: CourseListItem[];
  lang: Locale;
  dict: Pick<Dictionary, "duration"> & Pick<Dictionary, "card"> & { common: Pick<Dictionary["common"], "free"> } & { landing: Pick<Dictionary["landing"], "prev" | "next"> };
}) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id={headingId} className="font-display text-3xl sm:text-4xl">
          {title}
        </h2>
        <Link
          href={href}
          className="shrink-0 rounded border border-beige/40 px-4 py-2 text-sm font-semibold uppercase tracking-widest hover:border-beige hover:bg-beige hover:text-olive"
        >
          {linkLabel}
        </Link>
      </div>

      <Carousel
        label={title}
        slideClassName="basis-4/5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
        prevLabel={dict.landing.prev}
        nextLabel={dict.landing.next}
      >
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} lang={lang} dict={dict} />
        ))}
      </Carousel>
    </section>
  );
}
