import { HistoryView } from "@/components/HistoryView";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function Page() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <title>{dict.account.historyTitle}</title>
      <h1 className="mb-8 font-display text-4xl">{dict.account.historyTitle}</h1>
      <HistoryView lang={lang} dict={dict} />
    </div>
  );
}
