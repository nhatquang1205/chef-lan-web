import { LegalPage } from "@/components/LegalPage";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function Page() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  return <LegalPage doc="privacy" lang={lang} dict={dict} />;
}
