"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { createOrder, isCheckoutEnabled } from "@/lib/api/orders";
import type { OrderPaymentMethod, OrderTarget } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/** Whether the "Buy now" flow is available; null until the API has answered. */
export function useCheckoutEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void isCheckoutEnabled().then((value) => !cancelled && setEnabled(value));

    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}

/**
 * "Buy now": signed-out visitors are sent to log in and come back here; signed-in ones pick how to pay in a dialog
 * (contact chef Lan, always; bank transfer only when online payment is set up). Either choice creates the order
 * and goes to its page.
 */
export function BuyButton({
  target,
  lang,
  dict,
  label,
  returnTo,
}: {
  target: OrderTarget;
  lang: Locale;
  dict: Dictionary;
  label?: string;
  /** Where to come back to after logging in. */
  returnTo: string;
}) {
  const auth = useAuth();
  const router = useRouter();
  const transferEnabled = useCheckoutEnabled() === true;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState<OrderPaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toLogin = () => router.push(`${localePath(lang, "/login")}?next=${encodeURIComponent(returnTo)}`);

  const open = () => {
    if (auth.status !== "authenticated") {
      toLogin();
      return;
    }

    setError(null);
    dialogRef.current?.showModal();
  };

  const choose = async (method: OrderPaymentMethod) => {
    setBusy(method);
    setError(null);

    try {
      const token = await auth.getAccessToken();

      if (!token) {
        dialogRef.current?.close();
        setBusy(null);
        toLogin();
        return;
      }

      const order = await createOrder(token, target, method);
      router.push(localePath(lang, `/checkout/${order.code}`));
    } catch (failure) {
      setBusy(null);
      setError(
        failure instanceof ApiError && failure.status === 409
          ? dict.checkout.alreadyOwned
          : failure instanceof ApiError && failure.status === 403
            ? dict.checkout.customersOnly
            : dict.checkout.createFailed,
      );
    }
  };

  const options: { method: OrderPaymentMethod; title: string; text: string }[] = [
    { method: "ContactChef", title: dict.checkout.optionContactTitle, text: dict.checkout.optionContactText },
    ...(transferEnabled
      ? [{ method: "BankTransfer" as const, title: dict.checkout.optionTransferTitle, text: dict.checkout.optionTransferText }]
      : []),
  ];

  return (
    <div>
      <button
        type="button"
        onClick={open}
        className="rounded bg-terracotta px-6 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover"
      >
        {label ?? dict.checkout.buyNow}
      </button>

      {auth.status === "authenticated" && (
        <dialog
          ref={dialogRef}
          aria-labelledby="pay-method-title"
          // A click on the backdrop lands on the dialog element itself; clicks inside land on its children.
          onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
          className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-beige/20 bg-olive-raised p-0 text-beige backdrop:bg-black/70"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 id="pay-method-title" className="font-display text-2xl">
                {dict.checkout.chooseMethod}
              </h2>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label={dict.checkout.close}
                className="-mr-2 -mt-1 rounded p-2 text-beige/70 hover:text-beige"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {options.map((option) => (
                <button
                  key={option.method}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void choose(option.method)}
                  className="block w-full rounded-lg border border-beige/25 bg-olive p-4 text-left hover:border-beige/60 disabled:opacity-60"
                >
                  <span className="block font-semibold">{busy === option.method ? dict.checkout.creating : option.title}</span>
                  <span className="mt-1 block text-sm text-beige/75">{option.text}</span>
                </button>
              ))}
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-beige/80">
                {error}
              </p>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
