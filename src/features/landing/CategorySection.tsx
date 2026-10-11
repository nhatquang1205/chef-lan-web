import Link from "next/link";
import { Carousel } from "@/components/Carousel";
import { CourseCard } from "@/components/CourseCard";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Category, CourseListItem } from "@/lib/api/types";

export function CategorySection({
  category,
  courses,
  lang,
  dict,
}: {
  category: Category;
  courses: CourseListItem[];
  lang: Locale;
  dict: Dictionary;
}) {
  const headingId = `category-${category.slug}-heading`;

  return (
    <section id={`category-${category.slug}`} aria-labelledby={headingId} className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id={headingId} className="font-display text-3xl sm:text-4xl">
          {category.name}
        </h2>
        <Link
          href={`${localePath(lang, "/courses")}?category=${encodeURIComponent(category.slug)}`}
          className="shrink-0 rounded border border-beige/40 px-4 py-2 text-sm font-semibold uppercase tracking-widest hover:border-beige hover:bg-beige hover:text-olive"
        >
          {dict.landing.showMore}
        </Link>
      </div>

      <Carousel
        label={category.name}
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
