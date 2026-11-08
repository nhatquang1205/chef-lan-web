"use client";

import type { CourseListItem } from "@/lib/api/types";
import { useCatalogState } from "@/lib/catalogState/CatalogStateProvider";
import { formatVnd } from "@/lib/format";
import type { PriceDict } from "@/lib/priceDict";

const sizes = {
  card: { wrap: "gap-2", main: "text-lg font-semibold text-beige", struck: "text-sm text-beige/50" },
  hero: { wrap: "gap-3", main: "text-xl font-semibold", struck: "text-base font-normal text-beige/60" },
};

/**
 * The price line of a course: "Đã sở hữu" for an owner, "Miễn phí" for a course at 0, the reduced price with the list price
 * struck for a customer who qualifies, otherwise the list price (with the compare-at price struck).
 */
export function CoursePrice({
  course,
  dict,
  size = "card",
}: {
  course: Pick<CourseListItem, "id" | "priceVnd" | "priceDisplay" | "compareAtPriceVnd">;
  dict: PriceDict;
  size?: keyof typeof sizes;
}) {
  const { isOwned, finalPriceOf } = useCatalogState();
  const style = sizes[size];

  if (isOwned(course.id)) {
    return (
      <p className={`flex items-center gap-1.5 ${style.main}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M5 12.5 10 17.5 19 7" />
        </svg>
        {dict.card.owned}
      </p>
    );
  }

  if (course.priceVnd === 0) {
    return <p className={style.main}>{dict.common.free}</p>;
  }

  const finalPriceVnd = finalPriceOf(course.id);

  if (finalPriceVnd != null && finalPriceVnd < course.priceVnd) {
    return (
      <p className={`flex items-baseline ${style.wrap}`}>
        <span className={style.main}>{formatVnd(finalPriceVnd)}</span>
        <s className={style.struck}>{course.priceDisplay}</s>
      </p>
    );
  }

  return (
    <p className={`flex items-baseline ${style.wrap}`}>
      <span className={style.main}>{course.priceDisplay}</span>
      {course.compareAtPriceVnd != null && course.compareAtPriceVnd > course.priceVnd && (
        <s className={style.struck}>{formatVnd(course.compareAtPriceVnd)}</s>
      )}
    </p>
  );
}
