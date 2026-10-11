import Link from "next/link";
import { localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function NotFound() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-5xl">{dict.common.notFoundTitle}</h1>
      <p className="mt-4 text-beige/75">{dict.common.notFoundText}</p>
      <Link href={localePath(lang, "/")} className="mt-8 inline-block rounded bg-terracotta px-6 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover">
        {dict.common.backHome}
      </Link>
    </div>
  );
}
