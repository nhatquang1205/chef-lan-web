import { connection } from "next/server";
import { Suspense } from "react";
import { CategorySection } from "@/features/landing/CategorySection";
import { HeroSlider } from "@/features/landing/HeroSlider";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { listCategories, listLandingCourses, listLandingSharedModules } from "@/lib/api/catalog";
import { priceDict } from "@/lib/priceDict";

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

      <Suspense fallback={null}>
        <SharedModules />
      </Suspense>
    </>
  );
}

// Only the strings the client price component and the carousels use cross to the browser, not the whole dictionary.
const cardDict = (dict: Dictionary) => ({
  card: dict.card,
  common: { free: dict.common.free },
  duration: dict.duration,
  landing: { prev: dict.landing.prev, next: dict.landing.next },
});

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

  return <HeroSlider courses={courses} lang={lang} dict={{ ...priceDict(dict), nav: { home: dict.nav.home }, hero: dict.hero }} />;
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
      <CategorySection
        key={category.id}
        id={`category-${category.slug}`}
        title={category.name}
        href={`${localePath(lang, "/courses")}?category=${encodeURIComponent(category.slug)}`}
        linkLabel={dict.landing.showMore}
        courses={courses}
        lang={lang}
        dict={cardDict(dict)}
      />
    ));
}

async function SharedModules() {
  await connection();
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  let items;

  try {
    ({ items } = await listLandingSharedModules(6));
  } catch {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <CategorySection
      id="shared-modules"
      title={dict.landing.sharedModules}
      href={`${localePath(lang, "/courses")}?type=shared`}
      linkLabel={dict.landing.sharedModulesAll}
      courses={items}
      lang={lang}
      dict={cardDict(dict)}
    />
  );
}
