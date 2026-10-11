import Link from "next/link";
import { Suspense } from "react";
import { CourseCard } from "@/components/CourseCard";
import { Pagination } from "@/features/courses/Pagination";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { listCategories, searchCourses } from "@/lib/api/catalog";
import type { CourseLevel, CourseSort } from "@/lib/api/types";
import { template } from "@/lib/format";

const levels: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];
const sorts: CourseSort[] = ["Newest", "PriceAsc", "PriceDesc", "Title"];
const PAGE_SIZE = 12;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default function CoursesPage({ searchParams }: PageProps<"/[lang]/courses">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-olive-raised" aria-hidden />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const [lang, dict, raw] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  const basePath = localePath(lang, "/courses");

  // Validate against the allowed values: anything else is ignored, never forwarded.
  const q = first(raw.q).trim().slice(0, 100);
  const category = first(raw.category).slice(0, 140);
  const levelRaw = first(raw.level);
  const level = levels.find((l) => l === levelRaw);
  const sortRaw = first(raw.sort);
  const sort = sorts.find((s) => s === sortRaw) ?? "Newest";
  const page = Math.max(1, Number.parseInt(first(raw.page), 10) || 1);

  const [categoriesResult, resultsResult] = await Promise.allSettled([
    listCategories(),
    searchCourses({ q, categorySlug: category, level, sort, page, pageSize: PAGE_SIZE }),
  ]);

  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const activeCategory = categories.find((c) => c.slug === category);
  const filtered = Boolean(q || category || level || sort !== "Newest");

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (level) params.set("level", level);
    if (sort !== "Newest") params.set("sort", sort);
    if (target > 1) params.set("page", String(target));

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const field = "w-full rounded border border-beige/30 bg-olive px-3 py-2 text-beige placeholder:text-beige/40";
  const label = "mb-1 block text-xs font-semibold uppercase tracking-widest text-beige/70";

  return (
    <>
      <header className="mb-8">
        <h1 className="font-display text-4xl sm:text-5xl">{dict.courses.title}</h1>
        {activeCategory && (
          <p className="mt-2 text-beige/75">{template(dict.courses.inCategory, { name: activeCategory.name })}</p>
        )}
      </header>

      {/* A plain GET form: works without JavaScript, and every filter lives in the URL. */}
      <form method="get" action={basePath} role="search" aria-label={dict.courses.search} className="mb-8 grid gap-4 rounded-lg border border-beige/15 bg-olive-raised p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="q" className={label}>{dict.courses.search}</label>
          <input id="q" name="q" type="search" defaultValue={q} maxLength={100} placeholder={dict.courses.searchPlaceholder} className={field} />
        </div>
        <div>
          <label htmlFor="category" className={label}>{dict.courses.category}</label>
          <select id="category" name="category" defaultValue={category} className={field}>
            <option value="">{dict.courses.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="level" className={label}>{dict.courses.level}</label>
          <select id="level" name="level" defaultValue={level ?? ""} className={field}>
            <option value="">{dict.courses.allLevels}</option>
            {levels.map((l) => (
              <option key={l} value={l}>{dict.level[l]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className={label}>{dict.courses.sort}</label>
          <select id="sort" name="sort" defaultValue={sort} className={field}>
            <option value="Newest">{dict.courses.sortNewest}</option>
            <option value="PriceAsc">{dict.courses.sortPriceAsc}</option>
            <option value="PriceDesc">{dict.courses.sortPriceDesc}</option>
            <option value="Title">{dict.courses.sortTitle}</option>
          </select>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
          <button type="submit" className="rounded bg-terracotta px-5 py-2 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover">
            {dict.courses.apply}
          </button>
          {filtered && (
            <Link href={basePath} className="text-sm underline underline-offset-4 hover:text-beige">
              {dict.courses.clear}
            </Link>
          )}
        </div>
      </form>

      {resultsResult.status === "rejected" ? (
        <p role="alert" className="py-16 text-center text-beige/70">{dict.common.error}</p>
      ) : resultsResult.value.items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-xl">{dict.courses.empty}</p>
          <p className="mt-2 text-beige/65">{dict.courses.emptyHint}</p>
          {filtered && (
            <Link href={basePath} className="mt-6 inline-block rounded border border-beige/40 px-5 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-beige hover:text-olive">
              {dict.courses.clear}
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-beige/65">{template(dict.courses.results, { count: resultsResult.value.totalCount })}</p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resultsResult.value.items.map((course) => (
              <li key={course.id}>
                <CourseCard course={course} lang={lang} dict={dict} />
              </li>
            ))}
          </ul>
          <Pagination page={resultsResult.value.page} totalPages={resultsResult.value.totalPages} hrefFor={hrefFor} dict={dict} />
        </>
      )}
    </>
  );
}
