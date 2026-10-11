"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { template } from "@/lib/format";

/** The slice of Bunny's player.js API (an open standard) that this component uses. */
interface PlayerJs {
  on(event: string, callback: (data?: { seconds?: number }) => void): void;
  pause(): void;
  setCurrentTime(seconds: number): void;
  getCurrentTime(callback: (seconds: number) => void): void;
}

declare global {
  interface Window {
    playerjs?: { Player: new (element: HTMLIFrameElement) => PlayerJs };
  }
}

const PLAYERJS_SRC = "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";

function loadPlayerJs(): Promise<NonNullable<Window["playerjs"]>> {
  if (window.playerjs) {
    return Promise.resolve(window.playerjs);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PLAYERJS_SRC;
    script.async = true;
    script.onload = () => (window.playerjs ? resolve(window.playerjs) : reject(new Error("playerjs missing")));
    script.onerror = () => reject(new Error("playerjs failed to load"));
    document.head.appendChild(script);
  });
}

function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Bunny's embedded player, with the "free until N seconds" limit applied on top.
 *
 * The limit is enforced HERE, in the browser, through player.js: playback is stopped at the limit and
 * seeking past it is undone. It is a teaser limit, not a paywall: the iframe's signed link is for the
 * whole video, so someone who opens that link directly gets past it. Anything that must stay paid is
 * not marked free at all. For a limited video the player is fail-closed: it stays covered until
 * player.js has loaded and attached, and an error covers it if that never happens.
 */
export function VideoPlayer({
  url,
  title,
  freeTillSeconds,
  courseHref,
  dict,
}: {
  url: string;
  title: string;
  /** Null: the whole video is free and nothing is enforced. */
  freeTillSeconds: number | null;
  courseHref: string;
  dict: Dictionary;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const limited = freeTillSeconds != null;
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(limited ? "loading" : "ready");
  const [ended, setEnded] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(freeTillSeconds);

  useEffect(() => {
    if (freeTillSeconds == null) {
      return;
    }

    const limit = freeTillSeconds;
    let cancelled = false;
    let stopped = false;

    loadPlayerJs()
      .then((playerjs) => {
        if (cancelled || !iframeRef.current) {
          return;
        }

        const player = new playerjs.Player(iframeRef.current);

        const stop = () => {
          if (stopped) {
            return;
          }

          stopped = true;
          player.pause();
          player.setCurrentTime(limit);
          setRemaining(0);
          setEnded(true);
        };

        player.on("ready", () => {
          if (cancelled) {
            return;
          }

          setStatus("ready");

          player.on("timeupdate", (data) => {
            const seconds = data?.seconds ?? 0;

            if (seconds >= limit) {
              stop();
            } else if (!stopped) {
              setRemaining(limit - seconds);
            }
          });

          // A drag of the timeline past the limit: undo it.
          player.on("seeked", () => player.getCurrentTime((seconds) => seconds >= limit && stop()));

          // Once stopped, a play (keyboard, or a click that got through) is paused again.
          player.on("play", () => {
            if (stopped) {
              player.pause();
            }
          });
        });
      })
      .catch(() => !cancelled && setStatus("failed"));

    return () => {
      cancelled = true;
    };
  }, [freeTillSeconds]);

  const covered = status !== "ready" || ended;

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-lg border border-beige/15 bg-black">
        <iframe
          ref={iframeRef}
          src={url}
          title={title}
          loading="eager"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          // While covered, the iframe must not be reachable from the keyboard either.
          tabIndex={covered ? -1 : 0}
          className="absolute inset-0 h-full w-full"
        />

        {covered && (
          <div
            role={status === "failed" ? "alert" : "status"}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-olive/95 p-6 text-center"
          >
            {status === "loading" && <p>{dict.watch.loadingPlayer}</p>}
            {status === "failed" && <p>{dict.watch.playerFailed}</p>}
            {ended && status === "ready" && (
              <>
                <p className="font-display text-2xl">{dict.watch.previewEnded}</p>
                <p className="max-w-md text-beige/80">{dict.watch.previewEndedText}</p>
                <Link
                  href={courseHref}
                  className="rounded bg-terracotta px-5 py-2 text-sm font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover"
                >
                  {dict.watch.backToCourse}
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {limited && !ended && status === "ready" && remaining != null && (
        <p className="mt-3 text-sm text-beige/70" aria-live="off">
          {template(dict.watch.countdown, { time: clock(remaining) })}
        </p>
      )}
    </div>
  );
}
