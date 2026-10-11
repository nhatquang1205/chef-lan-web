import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "./config";
import type vi from "./dictionaries/vi.json";

export type Dictionary = typeof vi;

const dictionaries = {
  vi: () => import("./dictionaries/vi.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
} satisfies Record<Locale, () => Promise<Dictionary>>;

export async function getLocale(): Promise<Locale> {
  const value = await lang();

  if (!hasLocale(value)) {
    notFound();
  }

  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]();
}
