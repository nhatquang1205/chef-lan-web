import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function Page() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <title>{dict.auth.loginTitle}</title>
      <h1 className="mb-8 text-center font-display text-4xl">{dict.auth.loginTitle}</h1>
      {/* useSearchParams (the ?next= redirect) needs a boundary. */}
      <Suspense fallback={<div className="h-64 animate-pulse rounded bg-olive-raised" aria-hidden />}>
        <AuthForm mode="login" lang={lang} dict={dict} />
      </Suspense>
    </div>
  );
}
