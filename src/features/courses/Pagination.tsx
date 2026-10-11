import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { template } from "@/lib/format";

/** Previous/next as real links that keep every other filter. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  dict,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  dict: Dictionary;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const linkClass = "rounded border border-beige/40 px-4 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-beige hover:text-olive";
  const disabledClass = "rounded border border-beige/15 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-beige/30";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={linkClass}>
          {dict.courses.prevPage}
        </Link>
      ) : (
        <span className={disabledClass}>{dict.courses.prevPage}</span>
      )}
      <span className="text-sm text-beige/75">{template(dict.courses.pageOf, { page, total: totalPages })}</span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={linkClass}>
          {dict.courses.nextPage}
        </Link>
      ) : (
        <span className={disabledClass}>{dict.courses.nextPage}</span>
      )}
    </nav>
  );
}
