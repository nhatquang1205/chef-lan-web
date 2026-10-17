"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LessonVideo } from "@/components/LessonVideo";
import { Markdown } from "@/components/Markdown";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { LessonPage } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDuration, template } from "@/lib/format";

type State = { kind: "loading" } | { kind: "ok"; page: LessonPage } | { kind: "not_found" } | { kind: "error" };

/**
 * The lesson page body: description and recipe, then the player with a choice of the lesson's videos.
 * Fetched from the browser with the customer's token, because the recipe is only returned to owners.
 */
export function LessonView({ slug, lessonSlug, lang, dict }: { slug: string; lessonSlug: string; lang: Locale; dict: Dictionary }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>({ kind: "loading" });
  const courseHref = localePath(lang, `/courses/${slug}`);

  useEffect(() => {
    if (auth.status === "loading") {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await auth.getAccessToken();
        const page = await apiFetch<LessonPage>(
          `/api/v1/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}`,
          { token: token ?? undefined },
        );

        if (!cancelled) {
          setState({ kind: "ok", page });
        }
      } catch (error) {
        if (!cancelled) {
          setState(error instanceof ApiError && error.status === 404 ? { kind: "not_found" } : { kind: "error" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, auth.status, slug, lessonSlug]);

  if (state.kind === "loading") {
    return <div className="mx-auto h-96 max-w-5xl animate-pulse px-4 py-10" role="status" aria-label={dict.watch.checkingAccess} />;
  }

  if (state.kind === "not_found") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-5xl">{dict.common.notFoundTitle}</h1>
        <p className="mt-4 text-beige/75">{dict.common.notFoundText}</p>
        <Link href={courseHref} className="mt-8 inline-block rounded bg-terracotta px-6 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover">
          {dict.lesson.back}
        </Link>
      </div>
    );
  }

  if (state.kind === "error") {
    return <p role="alert" className="mx-auto max-w-5xl px-4 py-24 text-center text-beige/70">{dict.common.error}</p>;
  }

  const { page } = state;
  const { lesson } = page;
  const videos = lesson.videos;
  const requested = searchParams.get("v");
  // Default: the first video this viewer can actually play.
  const current =
    videos.find((v) => v.publicId === requested) ?? (page.hasAccess ? videos[0] : videos.find((v) => v.isFree) ?? videos[0]);
  const hasDetails = !!lesson.description || !!page.recipes || page.recipesLocked;

  const select = (publicId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("v", publicId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const lessonHref = (target: string) => localePath(lang, `/courses/${slug}/lessons/${target}`);

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <title>{`${lesson.title} · ${page.courseTitle}`}</title>

      <Link href={courseHref} className="text-sm uppercase tracking-widest text-beige/70 hover:text-beige">
        ← {page.courseTitle}
      </Link>

      <header className="mt-5">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{lesson.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-beige/70">
          <span>
            {videos.length} {dict.course.videos}
            {lesson.durationSeconds > 0 && ` · ${formatDuration(lesson.durationSeconds, dict)}`}
          </span>
          {!page.hasAccess && (
            <span className="rounded border border-beige/40 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-beige">
              {dict.course.notOwned}
            </span>
          )}
          {!lesson.includedInCourse && (
            <span className="rounded bg-terracotta/40 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-beige">
              {dict.course.addonsTitle}
            </span>
          )}
        </div>
        {!page.hasAccess && lesson.priceDisplay && (
          <p className="mt-4 rounded bg-terracotta/20 px-3 py-2 text-sm">
            <span className="font-semibold">{template(dict.course.lessonPrice, { price: lesson.priceDisplay })}</span>
            <span className="text-beige/70"> · {lesson.includedInCourse ? dict.course.buyLessonNote : dict.course.addonNote}</span>
          </p>
        )}
      </header>

      {hasDetails && (
        <details open className="group mt-6 rounded-lg border border-beige/15 bg-olive-raised/60">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 font-display text-xl">
            {dict.lesson.descriptionAndRecipe}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-180" aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="space-y-5 border-t border-beige/10 px-5 py-4">
            {lesson.description && <p className="whitespace-pre-line text-beige/90">{lesson.description}</p>}
            {page.recipes && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-beige/60">{dict.lesson.recipe}</h2>
                <Markdown>{page.recipes}</Markdown>
              </section>
            )}
            {page.recipesLocked && (
              <p className="flex items-center gap-2 rounded bg-black/20 px-3 py-2 text-sm text-beige/75">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                {dict.lesson.recipeLocked}
              </p>
            )}
          </div>
        </details>
      )}

      <section className="mt-8">
        {current ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <LessonVideo
              key={current.publicId}
              publicId={current.publicId}
              courseHref={courseHref}
              loginNext={`${lessonHref(lesson.slug)}?v=${current.publicId}`}
              lang={lang}
              dict={dict}
            />

            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-beige/60">{dict.lesson.videos}</h2>
              <ol className="space-y-2">
                {videos.map((video, index) => {
                  const active = video.publicId === current.publicId;
                  const locked = !page.hasAccess && !video.isFree;

                  return (
                    <li key={video.publicId}>
                      <button
                        type="button"
                        onClick={() => select(video.publicId)}
                        aria-current={active ? "true" : undefined}
                        className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          active ? "border-terracotta bg-terracotta/25" : "border-beige/15 hover:bg-olive-raised"
                        }`}
                      >
                        <span className="mt-0.5 w-5 shrink-0 text-beige/55">{index + 1}</span>
                        <span className="flex-1">
                          <span className="block">{video.title}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-beige/60">
                            {video.durationSeconds > 0 && formatDuration(video.durationSeconds, dict)}
                            {video.isFree && !page.hasAccess && (
                              <span className="rounded bg-terracotta px-1.5 py-0.5 font-semibold uppercase tracking-widest text-beige">
                                {video.freeTillSeconds != null ? template(dict.course.freeUntil, { seconds: video.freeTillSeconds }) : dict.lesson.free}
                              </span>
                            )}
                          </span>
                        </span>
                        {locked && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-1 shrink-0 text-beige/60" aria-label={dict.course.locked}>
                            <rect x="5" y="11" width="14" height="9" rx="2" />
                            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                          </svg>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-beige/15 px-4 py-6 text-center text-beige/70">{dict.lesson.noVideos}</p>
        )}
      </section>

      {(page.previous || page.next) && (
        <nav className="mt-10 flex flex-wrap justify-between gap-4 border-t border-beige/15 pt-6 text-sm">
          {page.previous ? (
            <Link href={lessonHref(page.previous.slug)} className="max-w-[45%] hover:text-beige">
              <span className="block uppercase tracking-widest text-beige/55">← {dict.lesson.previous}</span>
              <span className="mt-1 block">{page.previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {page.next && (
            <Link href={lessonHref(page.next.slug)} className="ml-auto max-w-[45%] text-right hover:text-beige">
              <span className="block uppercase tracking-widest text-beige/55">{dict.lesson.next} →</span>
              <span className="mt-1 block">{page.next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
