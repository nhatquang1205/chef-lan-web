"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { profileHref, stripLocale } from "./profileRedirect";
import type { Locale } from "@/i18n/config";

const EXEMPT = new Set(["/account/profile", "/login", "/activate"]);

/**
 * Sends a signed-in customer whose phone or province is missing to the profile page, from every other page.
 * Renders nothing, so the server HTML is the same for everybody; the redirect happens in an effect once the
 * session is known. Staff, anonymous visitors and a profile state that is still unknown are left alone.
 */
export function ProfileGate({ lang }: { lang: Locale }) {
  const { status, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const gated = status === "authenticated" && user?.actor === "Customer" && user.profileComplete === false;

  useEffect(() => {
    if (!gated || EXEMPT.has(stripLocale(pathname))) {
      return;
    }

    router.replace(profileHref(lang, pathname + window.location.search));
  }, [gated, lang, pathname, router]);

  return null;
}
