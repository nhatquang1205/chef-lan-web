import { localePath, type Locale } from "@/i18n/config";

/** Same-origin paths only: `?next=https://evil.example` or `//evil.example` would be an open redirect. */
export function safeNext(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;
}

/** The path without its locale prefix, and without a trailing slash. */
export function stripLocale(pathname: string): string {
  const stripped = pathname.replace(/^\/(vi|en)(?=\/|$)/, "").replace(/\/+$/, "");
  return stripped || "/";
}

/** The profile page, asking to come back to `next` (same-origin only) once it is saved. */
export function profileHref(lang: Locale, next: string | null): string {
  const base = localePath(lang, "/account/profile");
  const safe = safeNext(next);

  return safe ? `${base}?next=${encodeURIComponent(safe)}` : base;
}
