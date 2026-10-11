"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { locales, switchLocalePath, type Locale } from "@/i18n/config";

function Toggle({ lang, label }: { lang: Locale; label: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  return (
    <nav aria-label={label} className="flex items-center gap-1 text-sm font-semibold uppercase tracking-widest">
      {locales.map((target, index) => (
        <span key={target} className="flex items-center gap-1">
          {index > 0 && <span aria-hidden className="text-beige/40">|</span>}
          {target === lang ? (
            <span aria-current="true" className="text-beige">
              {target}
            </span>
          ) : (
            <Link
              href={`${switchLocalePath(pathname, target)}${search ? `?${search}` : ""}`}
              lang={target}
              className="text-beige/60 hover:text-beige"
            >
              {target}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function LanguageToggle(props: { lang: Locale; label: string }) {
  return (
    // useSearchParams needs a boundary; until it resolves, show the current locale only.
    <Suspense fallback={<span className="text-sm font-semibold uppercase tracking-widest">{props.lang}</span>}>
      <Toggle {...props} />
    </Suspense>
  );
}
