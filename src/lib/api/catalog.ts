import { cacheLife, cacheTag } from "next/cache";
import { apiFetch, ApiError } from "./client";
import type { Category, CourseDetail, CourseLevel, CourseListItem, CourseSort, Paged } from "./types";

/**
 * Landing-page data, cached for 60s at runtime. Callers must `await connection()` first (see
 * app/[lang]/page.tsx): without it Next runs these at build time and the build then needs the
 * API. Arguments are bounded (category slugs come from the API itself).
 */
const landingLife = { stale: 30, revalidate: 60, expire: 240 };

export async function listCategories(): Promise<Category[]> {
  "use cache";
  cacheLife(landingLife);
  cacheTag("catalog");

  return apiFetch<Category[]>("/api/v1/categories");
}

export async function listLandingCourses(categorySlug?: string, pageSize = 5): Promise<CourseListItem[]> {
  "use cache";
  cacheLife(landingLife);
  cacheTag("catalog");

  const params = new URLSearchParams({ pageSize: String(pageSize) });

  if (categorySlug) {
    params.set("categorySlug", categorySlug);
  }

  return (await apiFetch<Paged<CourseListItem>>(`/api/v1/courses?${params}`)).items;
}

export interface CourseSearch {
  q?: string;
  categorySlug?: string;
  level?: CourseLevel;
  sort?: CourseSort;
  page?: number;
  pageSize?: number;
}

/** Not cached: `q` is free text, so caching it would let anyone grow the cache without bound. */
export function searchCourses(search: CourseSearch): Promise<Paged<CourseListItem>> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  return apiFetch<Paged<CourseListItem>>(`/api/v1/courses?${params}`);
}

/** Null when the course does not exist (or is a draft — the API answers 404 for both). */
export async function getCourse(slug: string): Promise<CourseDetail | null> {
  try {
    return await apiFetch<CourseDetail>(`/api/v1/courses/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
