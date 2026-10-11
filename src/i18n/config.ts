export const locales = ["vi", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** A path in the given locale: Vietnamese is unprefixed, English is under /en. */
export function localePath(lang: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;

  if (lang === defaultLocale) {
    return clean;
  }

  return clean === "/" ? `/${lang}` : `/${lang}${clean}`;
}

/** The same page in another locale, from the visible pathname. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const stripped = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  return localePath(target, stripped);
}
