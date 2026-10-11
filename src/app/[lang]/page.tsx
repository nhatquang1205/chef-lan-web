import { connection } from "next/server";
import { Suspense } from "react";
import { CategorySection } from "@/features/landing/CategorySection";
import { HeroSlider } from "@/features/landing/HeroSlider";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { listCategories, listLandingCourses } from "@/lib/api/catalog";

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<div className="h-[420px] animate-pulse bg-olive-raised sm:h-[520px]" aria-hidden />}>
        <Hero />
      </Suspense>

      <div id="categories">
        <Suspense fallback={<div className="mx-auto h-96 max-w-7xl animate-pulse px-4 py-10" aria-hidden />}>
          <Categories />
        </Suspense>
      </div>
    </>
  );
}

// Both sections wait for a real request before touching the API (`connection()`), so
// `next build` never needs the backend and an outage during a build cannot fail it. The data
// functions are still cached at runtime.
async function Hero() {
  await connection();
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  let courses;

  try {
    courses = await listLandingCourses(undefined, 5);
  } catch {
    // The API being down must not take the whole landing page with it.
    return null;
  }

  return <HeroSlider courses={courses} lang={lang} dict={dict} />;
}

async function Categories() {
  await connection();
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  let categories;

  try {
    categories = await listCategories();
  } catch {
    return <p className="mx-auto max-w-7xl px-4 py-16 text-center text-beige/70">{dict.common.error}</p>;
  }

  const sections = await Promise.all(
    categories.map(async (category) => {
      try {
        return { category, courses: await listLandingCourses(category.slug, 5) };
      } catch {
        return { category, courses: [] };
      }
    }),
  );

  // A category with no published courses is noise on a landing page.
  return sections
    .filter((section) => section.courses.length > 0)
    .map(({ category, courses }) => (
      <CategorySection key={category.id} category={category} courses={courses} lang={lang} dict={dict} />
    ));
}
