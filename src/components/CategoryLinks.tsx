import Link from "next/link";
import { connection } from "next/server";
import { localePath, type Locale } from "@/i18n/config";
import { listCategories } from "@/lib/api/catalog";

/**
 * The items of the header's Categories dropdown: every Active category, linking to the course
 * list filtered by it. A server component streamed into the (client) header as a slot.
 * `connection()` keeps it out of the build, as with the landing sections. If the API is down
 * the menu is simply empty — it must never take the header with it.
 */
export async function CategoryLinks({ lang }: { lang: Locale }) {
  await connection();

  let categories;

  try {
    categories = await listCategories();
  } catch {
    return null;
  }

  return categories.map((category) => (
    <li key={category.id} role="none">
      <Link
        role="menuitem"
        href={`${localePath(lang, "/courses")}?category=${encodeURIComponent(category.slug)}`}
        className="block whitespace-nowrap rounded px-4 py-2 text-sm hover:bg-beige/10"
      >
        {category.name}
      </Link>
    </li>
  ));
}
