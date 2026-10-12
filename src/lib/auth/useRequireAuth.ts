"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { localePath, type Locale } from "@/i18n/config";

/** Sends anonymous visitors to the login page, which returns them here afterwards. */
export function useRequireAuth(lang: Locale) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (auth.status === "anonymous") {
      router.replace(`${localePath(lang, "/login")}?next=${encodeURIComponent(pathname)}`);
    }
  }, [auth.status, lang, pathname, router]);

  return auth;
}
