import type { Metadata } from "next";
import { Suspense } from "react";
import { WatchRedirect } from "@/components/WatchRedirect";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

// Only a redirect: keep it out of search indexes.
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

  // Old links: the browser finds the video's lesson (with the customer's token) and moves there.
  return <WatchRedirect slug={slug} videoId={videoId} lang={lang} dict={dict} />;
}
