import type { Metadata } from "next";
import { Suspense } from "react";
import { WatchView } from "@/components/WatchView";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

// The page is gated content and carries a signed link: keep it out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function WatchPage({ params }: PageProps<"/[lang]/courses/[slug]/watch/[videoId]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-5xl animate-pulse px-4 py-10" aria-hidden />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[lang]/courses/[slug]/watch/[videoId]">["params"] }) {
  const [lang, dict, { slug, videoId }] = await Promise.all([getLocale(), getDictionary(), params]);

  // The playback request is made from the browser (see WatchView), so the customer's token can be sent.
  return <WatchView slug={slug} videoId={videoId} lang={lang} dict={dict} />;
}
