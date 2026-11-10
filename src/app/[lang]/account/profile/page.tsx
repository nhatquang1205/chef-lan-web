import { Suspense } from "react";
import { ProfileView } from "@/components/ProfileView";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function Page() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <title>{dict.profile.title}</title>
      <h1 className="mb-8 text-center font-display text-4xl">{dict.profile.title}</h1>
      <Suspense>
        <ProfileView lang={lang} dict={dict} />
      </Suspense>
    </div>
  );
}
