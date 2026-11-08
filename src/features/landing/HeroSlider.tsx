"use client";

import Link from "next/link";
import { Carousel } from "@/components/Carousel";
import { Thumbnail } from "@/components/Thumbnail";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CourseListItem } from "@/lib/api/types";
import { useCatalogState } from "@/lib/catalogState/CatalogStateProvider";
import { formatVnd } from "@/lib/format";

/** Newest published courses, one per slide, without the ones this customer owns. Renders nothing when none are left. */
export function HeroSlider({
  courses,
  lang,
  dict,
}: {
  courses: CourseListItem[];
  lang: Locale;
  dict: { nav: Pick<Dictionary["nav"], "home">; hero: Dictionary["hero"] };
}) {
  const { isOwned, finalPriceOf } = useCatalogState();
  const visible = courses.filter((course) => !isOwned(course.id));

  if (visible.length === 0) {
    return null;
  }

  return (
    <section aria-label={dict.nav.home} className="border-b border-beige/15">
      <Carousel
        label={dict.nav.home}
        slideClassName="basis-full"
        gapClassName="ml-0"
        autoplayMs={6000}
        loop
        dots
        prevLabel={dict.hero.prev}
        nextLabel={dict.hero.next}
        goToLabel={dict.hero.goTo}
      >
        {visible.map((course, index) => (
          <div key={course.id} className="relative isolate -ml-4 h-[420px] overflow-hidden sm:h-[520px]">
            <Thumbnail src={course.thumbnailUrl} alt="" priority={index === 0} sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-olive via-olive/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-olive/80 to-transparent" />

            <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center gap-4 px-4 sm:px-6">
              <h2 className="max-w-2xl font-display text-4xl leading-tight text-beige sm:text-6xl">{course.title}</h2>
              {course.subtitle && <p className="max-w-xl text-lg text-beige/85 sm:text-xl">{course.subtitle}</p>}
              <HeroPrice course={course} finalPriceVnd={finalPriceOf(course.id)} />
              <Link
                href={localePath(lang, `/courses/${course.slug}`)}
                className="w-fit rounded bg-terracotta px-6 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover"
              >
                {dict.hero.viewCourse}
              </Link>
            </div>
          </div>
        ))}
      </Carousel>
    </section>
  );
}

function HeroPrice({ course, finalPriceVnd }: { course: CourseListItem; finalPriceVnd?: number }) {
  if (finalPriceVnd == null || finalPriceVnd >= course.priceVnd) {
    return <p className="text-xl font-semibold">{course.priceDisplay}</p>;
  }

  return (
    <p className="flex items-baseline gap-3 text-xl font-semibold">
      {formatVnd(finalPriceVnd)}
      <s className="text-base font-normal text-beige/60">{course.priceDisplay}</s>
    </p>
  );
}
