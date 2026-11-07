import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { apiFetch } from "@/lib/api/client";
import type { CourseListItem, Paged } from "@/lib/api/types";
import { localePath, locales } from "@/i18n/config";
import { siteUrl } from "@/lib/site";

const staticPaths = ["/", "/courses", "/terms", "/privacy", "/refund"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Resolved per request: building must not need the API.
  await connection();

  const origin = siteUrl();
  const urls = (path: string) => Object.fromEntries(locales.map((lang) => [lang, `${origin}${localePath(lang, path)}`]));
  const entry = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: `${origin}${localePath("vi", path)}`,
    lastModified,
    alternates: { languages: urls(path) },
  });

  let courses: CourseListItem[] = [];

  try {
    courses = (await apiFetch<Paged<CourseListItem>>("/api/v1/courses?pageSize=100")).items;
  } catch {
    // API down: the static pages are still worth listing.
  }

  try {
    // Shared modules are off the course list but their pages stay public.
    courses = [...courses, ...(await apiFetch<Paged<CourseListItem>>("/api/v1/shared-modules?pageSize=100")).items];
  } catch {
    // Same: one failing list must not drop the other.
  }

  return [...staticPaths.map((path) => entry(path)), ...courses.map((course) => entry(`/courses/${course.slug}`, course.publishedAt ?? undefined))];
}
