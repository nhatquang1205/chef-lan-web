import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";

/** Text wordmark in the display font; the full logo artwork is used in the footer. */
export function Logo({ lang }: { lang: Locale }) {
  return (
    <Link href={localePath(lang, "/")} className="font-display text-2xl leading-none tracking-wide text-beige">
      Bon Bocon
    </Link>
  );
}
