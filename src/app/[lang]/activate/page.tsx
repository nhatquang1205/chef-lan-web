import type { Metadata } from "next";
import { ActivateView } from "@/components/ActivateView";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <title>{dict.activate.title}</title>
      <h1 className="mb-8 text-center font-display text-4xl">{dict.activate.title}</h1>
      <ActivateView lang={lang} dict={dict} />
    </div>
  );
}
