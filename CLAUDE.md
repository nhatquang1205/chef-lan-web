# CLAUDE.md

Customer web for chef Lan's cooking courses. Backend, plans and decisions live in the
`chef-lan` repo: `docs/customer-web/` (spec + plans) and its `CLAUDE.md`.

@AGENTS.md

**This is Next.js 16, not the version in your memory.** Read the relevant guide in
`node_modules/next/dist/docs/` before writing Next code. Differences already hit here:
`middleware` is `proxy.ts`; error boundaries receive `retry`, not `reset`; `next/image`'s
`priority` is deprecated (use `loading="eager"` + `fetchPriority="high"`); and
`cacheComponents` is on.

## Cache Components rules

- Anything dynamic (`searchParams`, `params`, `usePathname`, `useSearchParams`, uncached
  `fetch`) must sit under a `<Suspense>` or the build fails with a "blocking route" error.
  The header is wrapped in one in `app/[lang]/layout.tsx` for this reason.
- Landing data (`src/lib/api/catalog.ts`) uses `"use cache"` with `expire` **under 5 minutes**
  on purpose: that makes it a request-time hole, so `next build` never needs the API and an
  outage during a build cannot be baked into the HTML. Do not raise `expire` past 5 minutes.
- Do not cache anything keyed on free user input (`/courses` search): unbounded cache growth.
- No `new Date()` / `Date.now()` / `Math.random()` in server components outside a
  cache or Suspense boundary — it blocks prerendering.

## i18n

Hand-rolled, no library: `src/i18n/`. Routes are under `app/[lang]`; `src/proxy.ts` rewrites a
bare path to `/vi/...` and redirects a visible `/vi/...` back to the bare path. English is
`/en/...`. Always build links with `localePath(lang, path)`. Only UI chrome is translated;
course and category text comes from the API in Vietnamese.

Both `vi.json` and `en.json` must have the same keys (`Dictionary` is typed from `vi.json`).

## Auth

Tokens are in **localStorage** (`src/lib/auth/AuthProvider.tsx`), chosen over httpOnly cookies:
simpler and no BFF, but any XSS can read them. The backend's refresh-token rotation with
reuse detection limits the damage. If this is ever revisited, move the calls into Next route
handlers and set httpOnly cookies; CORS then becomes unnecessary.

The browser calls the API directly, so the backend's `Cors:AllowedOrigins` must contain this
site's origin. `?next=` after login is accepted only for same-origin paths (open-redirect guard).

The header renders its account area behind a `useHydrated()` flag: it streams in behind
Suspense, so reading auth state on the first client render would mismatch the server HTML.

## API types

`src/lib/api/types.ts` is hand-written (the generated OpenAPI types render every int64 as
`number | string`). Keep it in step with the backend's `Contracts`. Enums are strings.

## Brand

Dark theme only. Tokens in `src/app/globals.css`: olive `#2b2a16` (background), beige `#d3c8b6`
(text), terracotta `#7a3f21` (accent). **Terracotta is for backgrounds with beige text**; as
text on olive it is about 1.8:1 and fails contrast. Fonts are stand-ins for the brand fonts
(GLANCE / Calps Sans): Yeseva One (display) and Barlow Semi Condensed (body), both with the
Vietnamese subset.

## Known gaps

- `/courses/{unknown}` answers HTTP 200 (with the not-found UI), because `notFound()` fires
  after streaming starts under Cache Components. A soft-404 for crawlers.
- Thumbnails use `unoptimized` because their host is not fixed; no resizing by Next.
- Search is accent-sensitive (backend limitation).
- No tests yet. The login flow, locale switching and the filter form deserve Playwright tests.
