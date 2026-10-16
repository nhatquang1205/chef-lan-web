import { Suspense } from "react";
import { LessonView } from "@/components/LessonView";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default function LessonPage({ params }: PageProps<"/[lang]/courses/[slug]/lessons/[lessonSlug]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-5xl animate-pulse px-4 py-10" aria-hidden />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[lang]/courses/[slug]/lessons/[lessonSlug]">["params"] }) {
  const [lang, dict, { slug, lessonSlug }] = await Promise.all([getLocale(), getDictionary(), params]);

  // The lesson is fetched from the browser (see LessonView), so the customer's token can be sent.
  return <LessonView slug={slug} lessonSlug={lessonSlug} lang={lang} dict={dict} />;
}
