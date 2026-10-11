import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Vietnamese is the default locale and lives at the bare path (`/courses`); English lives
 * under `/en`. Routes are all nested under app/[lang], so a bare path is rewritten to
 * `/vi/...` internally, and a visible `/vi/...` is redirected to the bare path so there is
 * one canonical URL per page.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (pathname === "/vi" || pathname.startsWith("/vi/")) {
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  url.pathname = `/vi${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals and anything with a file extension (icon.png, logo.png, ...).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
