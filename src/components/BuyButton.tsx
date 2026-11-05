"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { createOrder, isCheckoutEnabled } from "@/lib/api/orders";
import type { OrderTarget } from "@/lib/api/types";
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
 * Starts a purchase and goes to its payment page. Signed-out visitors are sent to log in first and come back here.
 * Renders nothing unless online payment is set up, so the page keeps its "contact chef Lan" note otherwise.
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
  const enabled = useCheckoutEnabled();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) {
    return null;
  }

  const start = async () => {
    if (auth.status !== "authenticated") {
      router.push(`${localePath(lang, "/login")}?next=${encodeURIComponent(returnTo)}`);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const token = await auth.getAccessToken();

      if (!token) {
        router.push(`${localePath(lang, "/login")}?next=${encodeURIComponent(returnTo)}`);
        return;
      }

      const order = await createOrder(token, target);
      router.push(localePath(lang, `/checkout/${order.code}`));
    } catch (failure) {
      setBusy(false);
      setError(
        failure instanceof ApiError && failure.status === 409
          ? dict.checkout.alreadyOwned
          : failure instanceof ApiError && failure.status === 403
            ? dict.checkout.customersOnly
            : dict.checkout.createFailed,
      );
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        className="rounded bg-terracotta px-6 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover disabled:opacity-60"
      >
        {busy ? dict.checkout.creating : (label ?? dict.checkout.buyNow)}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-beige/80">
          {error}
        </p>
      )}
    </div>
  );
}
