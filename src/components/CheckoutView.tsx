"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { cancelOrder, getOrder } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatVnd, template } from "@/lib/format";
import { formatClock } from "@/lib/history";
import { CONTACT_PHONE, contact, telHref } from "@/lib/contact";

type State = { kind: "loading" } | { kind: "ok"; order: Order } | { kind: "not_found" } | { kind: "error" };

// Fast for the first two minutes (the customer is looking at the QR), then gentler.
const FAST_POLL_MS = 3_000;
const SLOW_POLL_MS = 8_000;
const FAST_WINDOW_MS = 120_000;

/**
 * The payment page: sends the customer to SePay's hosted page and waits for the payment to be confirmed. The status is POLLED, not pushed:
 * one event per purchase does not justify a socket, and this endpoint is the fallback after a reload anyway.
 */
export function CheckoutView({ code, lang, dict }: { code: string; lang: Locale; dict: Dictionary }) {
  const auth = useRequireAuth(lang);
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [retrying, setRetrying] = useState(false);
  const [now, setNow] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const order = state.kind === "ok" ? state.order : null;
  const pending = order?.status === "Pending";

  useEffect(() => {
    if (auth.status !== "authenticated") {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    const startedAt = Date.now();

    const schedule = () => {
      timer = window.setTimeout(() => (document.hidden ? schedule() : void load()), Date.now() - startedAt < FAST_WINDOW_MS ? FAST_POLL_MS : SLOW_POLL_MS);
    };

    const load = async () => {
      try {
        const token = await auth.getAccessToken();

        if (!token) {
          return;
        }

        const next = await getOrder(token, code);

        if (cancelled) {
          return;
        }

        setState({ kind: "ok", order: next });
        setRetrying(false);

        if (next.status !== "Pending") {
          return;
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          setState({ kind: "not_found" });
          return;
        }

        // A network blip or a server error: keep what is on screen and try again.
        setRetrying(true);
        setState((current) => (current.kind === "loading" ? { kind: "error" } : current));
      }

      schedule();
    };

    // Coming back to the tab: check straight away instead of waiting for the next tick.
    const onVisible = () => {
      if (!document.hidden) {
        window.clearTimeout(timer);
        void load();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    void load();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [auth, code]);

  useEffect(() => {
    if (!pending) {
      return;
    }

    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1_000);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [pending]);

  const courseSlug = order?.items[0]?.courseSlug;
  const courseHref = courseSlug ? localePath(lang, `/courses/${courseSlug}`) : localePath(lang, "/courses");

  if (state.kind === "loading") {
    return <div className="mx-auto h-96 max-w-4xl animate-pulse px-4 py-10" role="status" aria-label={dict.account.loading} />;
  }

  if (state.kind === "not_found") {
    return (
      <Message title={dict.common.notFoundTitle} text={dict.common.notFoundText}>
        <Link href={localePath(lang, "/courses")} className={buttonClass}>
          {dict.account.browseCourses}
        </Link>
      </Message>
    );
  }

  if (state.kind === "error" || !order) {
    return <p role="alert" className="mx-auto max-w-4xl px-4 py-24 text-center text-beige/70">{dict.common.error}</p>;
  }

  if (order.status === "Paid") {
    return (
      <Message title={dict.checkout.paidTitle} text={dict.checkout.paidText} live>
        {/* A plain link: a full page load, so the course page asks for access afresh and unlocks. */}
        <a href={courseHref} className={buttonClass}>
          {dict.checkout.startLearning}
        </a>
      </Message>
    );
  }

  if (order.status === "Expired" || order.status === "Cancelled") {
    const expired = order.status === "Expired";

    return (
      <Message
        title={expired ? dict.checkout.expiredTitle : dict.checkout.cancelledTitle}
        text={
          expired
            ? template(order.paymentMethod === "ContactChef" ? dict.checkout.expiredContactText : dict.checkout.expiredText, { code: order.code })
            : dict.checkout.cancelledText
        }
      >
        <a href={courseHref} className={buttonClass}>
          {dict.checkout.backToCourse}
        </a>
      </Message>
    );
  }

  const payment = order.payment;
  const byContact = order.paymentMethod === "ContactChef";
  const title = byContact ? template(dict.checkout.contactTitle, { code: order.code }) : dict.checkout.title;
  const remainingSeconds = now === 0 ? null : Math.max(0, Math.ceil((new Date(order.expiresAt).getTime() - now) / 1000));

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <title>{title}</title>
      <h1 className="font-display text-4xl">{title}</h1>

      <dl className="mt-6 divide-y divide-beige/10 rounded-lg border border-beige/15 bg-olive-raised">
        {order.items.map((item) => (
          <div key={item.title} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="min-w-0">{item.title}</dt>
            <dd className="shrink-0 font-semibold">{formatVnd(item.unitPriceVnd)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-xs uppercase tracking-widest text-beige/55">{dict.checkout.amount}</dt>
          <dd className="font-display text-2xl">{formatVnd(order.amountVnd)}</dd>
        </div>
      </dl>

      {byContact && (
        <section className="mt-6 rounded-lg border border-beige/15 bg-olive-raised p-5">
          <p>{template(dict.checkout.contactText, { code: order.code })}</p>
          <p className="mt-4 text-xs uppercase tracking-widest text-beige/55">{dict.checkout.contactCodeLabel}</p>
          <p className="font-display text-4xl tracking-wider">{order.code}</p>
          <ul className="mt-4 space-y-2">
            <li>
              <a href={telHref(CONTACT_PHONE)} className="font-semibold underline underline-offset-4">
                {CONTACT_PHONE}
              </a>{" "}
              <span className="text-beige/55">(Hotline)</span>
            </li>
            {contact.social
              .filter((item) => "chef" in item)
              .map((item) => (
                <li key={item.href}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                    {item.label} {item.handle}
                  </a>
                </li>
              ))}
          </ul>
        </section>
      )}

      {payment && (
        // The form is signed by the API: its fields must go to SePay exactly as received. A plain POST leaves the site, and
        // SePay sends the customer back to this page (the return URLs), where the polling below picks up the result.
        <form method="post" action={payment.actionUrl} onSubmit={() => setRedirecting(true)} className="mt-6">
          {payment.fields.map((field) => (
            <input key={field.name} type="hidden" name={field.name} value={field.value} />
          ))}
          <button
            type="submit"
            disabled={redirecting}
            className="w-full rounded bg-terracotta px-6 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover disabled:opacity-60 sm:w-auto"
          >
            {redirecting ? dict.checkout.redirecting : dict.checkout.payWithQr}
          </button>
          <p className="mt-3 text-sm text-beige/70">{dict.checkout.payHint}</p>
        </form>
      )}

      <p role="status" className="mt-6 flex flex-wrap items-center gap-x-4 text-sm text-beige/80">
        <span>{retrying ? dict.checkout.retrying : dict.checkout.waiting}</span>
        {byContact ? (
          <span>
            {template(dict.checkout.heldUntil, {
              date: new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.expiresAt)),
            })}
          </span>
        ) : (
          remainingSeconds !== null && <span>{template(dict.checkout.expiresIn, { time: formatClock(remainingSeconds) })}</span>
        )}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link href={courseHref} className="text-sm uppercase tracking-widest text-beige/70 hover:text-beige">
          ← {dict.checkout.backToCourse}
        </Link>
        <button
          type="button"
          disabled={cancelling}
          onClick={() => {
            setCancelling(true);
            void (async () => {
              try {
                const token = await auth.getAccessToken();
                if (token) await cancelOrder(token, order.code);
              } finally {
                router.push(courseHref);
              }
            })();
          }}
          className="text-sm uppercase tracking-widest text-beige/70 underline underline-offset-4 hover:text-beige disabled:opacity-60"
        >
          {dict.checkout.cancel}
        </button>
      </div>
    </article>
  );
}

const buttonClass =
  "mt-8 inline-block rounded bg-terracotta px-6 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover";

function Message({ title, text, live, children }: { title: string; text: string; live?: boolean; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" role={live ? "status" : undefined}>
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-4 text-beige/75">{text}</p>
      {children}
    </div>
  );
}
