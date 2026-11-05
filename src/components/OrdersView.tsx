"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listMyOrders } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/lib/format";

export function OrdersView({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const auth = useRequireAuth(lang);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [failed, setFailed] = useState(false);
  const isStaff = auth.user?.actor === "Staff";

  useEffect(() => {
    // An admin login cannot buy, so it has no orders (the endpoint is customer-only).
    if (auth.status !== "authenticated" || isStaff) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await auth.getAccessToken();

        if (token) {
          const result = await listMyOrders(token);
          if (!cancelled) setOrders(result);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, auth.status, isStaff]);

  if (isStaff) {
    return <p role="status" className="text-beige/75">{dict.account.staffNoOrders}</p>;
  }

  if (failed) {
    return <p role="alert" className="text-beige/70">{dict.common.error}</p>;
  }

  if (!orders) {
    return <div className="h-40 animate-pulse rounded-lg bg-olive-raised" role="status" aria-label={dict.account.loading} />;
  }

  if (orders.length === 0) {
    return <p className="text-beige/75">{dict.account.ordersEmpty}</p>;
  }

  const dateFormat = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium" });

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.code} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-beige/15 bg-olive-raised p-4">
          <div className="min-w-0">
            <p className="font-display text-xl leading-snug">{order.items.map((item) => item.title).join(", ")}</p>
            <p className="mt-1 text-sm text-beige/70">
              {order.code} · {dateFormat.format(new Date(order.createdAt))} · {formatVnd(order.amountVnd)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded border border-beige/40 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">
              {order.status === "Pending" && order.paymentMethod === "ContactChef" ? dict.account.awaitingChef : dict.account.orderStatus[order.status]}
            </span>
            {order.status === "Pending" && (
              <Link
                href={localePath(lang, `/checkout/${order.code}`)}
                className="rounded bg-terracotta px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover"
              >
                {order.paymentMethod === "ContactChef" ? dict.account.viewOrder : dict.account.payNow}
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
