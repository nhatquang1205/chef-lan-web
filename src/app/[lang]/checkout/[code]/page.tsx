import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutView } from "@/components/CheckoutView";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

// A private payment page: keep it out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CheckoutPage({ params }: PageProps<"/[lang]/checkout/[code]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-4xl animate-pulse px-4 py-10" aria-hidden />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[lang]/checkout/[code]">["params"] }) {
  const [lang, dict, { code }] = await Promise.all([getLocale(), getDictionary(), params]);

  // The order is read from the browser with the customer's token (see CheckoutView).
  return <CheckoutView code={code} lang={lang} dict={dict} />;
}
