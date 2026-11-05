import { apiFetch } from "./client";
import type { Order, OrderPaymentMethod, OrderTarget } from "./types";

let configRequest: Promise<boolean> | null = null;

/** Is online payment set up? Asked once per page load; a failure means "no", so the site falls back to contacting chef Lan. */
export function isCheckoutEnabled(): Promise<boolean> {
  configRequest ??= apiFetch<{ enabled: boolean }>("/api/v1/checkout/config")
    .then((config) => config.enabled)
    .catch(() => false);

  return configRequest;
}

/** Starts a purchase, or returns the order already waiting for payment for the same item (switched to this method). The price is the server's. */
export function createOrder(token: string, target: OrderTarget, method: OrderPaymentMethod): Promise<Order> {
  return apiFetch<Order>("/api/v1/orders", { method: "POST", token, body: { ...target, method } });
}

export function getOrder(token: string, code: string, signal?: AbortSignal): Promise<Order> {
  return apiFetch<Order>(`/api/v1/orders/${encodeURIComponent(code)}`, { token, signal });
}

export function cancelOrder(token: string, code: string): Promise<Order> {
  return apiFetch<Order>(`/api/v1/orders/${encodeURIComponent(code)}/cancel`, { method: "POST", token });
}

export function listMyOrders(token: string): Promise<Order[]> {
  return apiFetch<Order[]>("/api/v1/me/orders", { token });
}
