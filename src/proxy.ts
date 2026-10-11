import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Vietnamese is the default locale and lives at the bare path (`/courses`); English lives
 * under `/en`. Routes are all nested under app/[lang], so a bare path is rewritten to
 * `/vi/...` internally.
 *
 * Do NOT redirect a visible `/vi/...` back to the bare path here or in next.config.ts
 * `redirects()`: in production both also see the rewritten `/vi/...` and redirect it again,
 * an infinite 308 loop. (Works in `next dev`, which is how it slipped through.) Nothing links
 * to `/vi/...`; typing it by hand just serves the same page.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/") || pathname === "/vi" || pathname.startsWith("/vi/")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/vi${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals and anything with a file extension (icon.png, logo.png, ...).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
