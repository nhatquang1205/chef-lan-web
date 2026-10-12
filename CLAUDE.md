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
- Landing data (`src/lib/api/catalog.ts`) is cached with `"use cache"`, but the components that
  call it must `await connection()` first. Without that, `next build` executes the fetch and
  fails whenever the API is unreachable (CI, a build while the backend is down). A short
  `expire` alone does NOT prevent this. Always verify with the API **stopped**:
  `pnpm build` must succeed.
- Do not cache anything keyed on free user input (`/courses` search): unbounded cache growth.
- No `new Date()` / `Date.now()` / `Math.random()` in server components outside a
  cache or Suspense boundary — it blocks prerendering.

## i18n

Hand-rolled, no library: `src/i18n/`. Routes are under `app/[lang]`; `next.config.ts` `rewrites()` maps a
bare path to `/vi/...` (English is `/en/...`, left alone). **Not a `proxy.ts`**: a proxy rewrite
behind nginx's `X-Forwarded-Proto: https` made Next fetch `https://localhost:3100` over TLS
and every page was a 500 (invisible locally). And do not redirect `/vi/...` back to the bare
path, in config or anywhere: in production the rewritten path is redirected again and loops
(308). **Always test with `pnpm build && pnpm start` and the nginx headers:**
`curl -H "Host: x.example" -H "X-Forwarded-Proto: https" http://127.0.0.1:3100/` must be 200. Always build links with `localePath(lang, path)`. Only UI chrome is translated;
course and category text comes from the API in Vietnamese.

Both `vi.json` and `en.json` must have the same keys (`Dictionary` is typed from `vi.json`).

## Who owns what (browser-side)

Login tokens live in the browser, so server-rendered pages cannot know who is watching. Two things therefore
call the API **from the browser** with the customer's token: `WatchView` (playback, so an owner of the course or
lesson unlocks the video and loses the preview limit) and `CourseAccessProvider` (the outline overlay: "Owned"
badge and WATCH VIDEO instead of the lock, from `GET /courses/{slug}/access`). The API enforces access; the
overlay only changes buttons. `AuthProvider.getAccessToken()` hands out a token renewed when near expiry, one
renewal at a time (refresh tokens rotate). **The session ref is set together with the state, never from an
effect:** child effects run before the provider's, and an effect-synced ref was still empty when the access
provider asked for a token, so the access request was silently never sent. Lessons with a `priceVnd` show a
"buy this lesson on its own" note; there is no online checkout, so it says to contact chef Lan.

## Watch page and the preview limit

`/courses/{slug}/watch/{videoId}` (`videoId` is the opaque `publicId`) embeds Bunny's player in an iframe
and controls it with Bunny's player.js (`playerjs-latest.min.js`: `on`, `pause`, `setCurrentTime`,
`getCurrentTime`; events `ready`, `timeupdate`, `seeked`, `play`). `VideoPlayer` applies `freeTillSeconds`:
stop at the limit, undo seeks past it, cover with an overlay. **It is a teaser limit, not a paywall** (the
iframe's signed link is for the whole video). It fails closed: for a limited video the player stays covered
and unfocusable until player.js has attached. The link comes from `getPlayback()` per page view, never
cached. Outline buttons: free + no limit = WATCH VIDEO, free + limit = WATCH PREVIEW, paid = lock, no link.
Next 16 keeps the state of a page you navigate away from, so back/forward can revive an "ended" overlay;
test the limiter with full page loads. Real-Bunny behaviour is unverified.

## Account menu, history and my courses

`AccountMenu` replaces the Login button once signed in: the user's name, with a dropdown (hover, focus,
chevron; flat list in the mobile menu) of My courses, History and Log out. `AuthUser` now carries `id`;
sessions stored without it are dropped (sign in again).

Watch history is **FE only**, in localStorage under `cheflan.history.v1.<actor>-<id>` (`src/lib/history.ts`,
newest first, 50 max). `VideoPlayer` reports progress every 10s and on pause/end/page hide, and the watch page
resumes from it. localStorage rather than IndexedDB: tiny data, synchronous, same as the session. Not synced
across devices.

`/account/courses` lists `GET /api/v1/me/courses` (`getMyCourses`, customer token only: a staff login gets 403/empty).

## Header categories dropdown

`CategoryLinks` (server component, `await connection()`, swallows API errors) is streamed into the
client `SiteHeader` as the `categoryLinks` slot. It lists every **Active** category, including ones with
no published courses (the landing page hides those; the dropdown links to the filtered list, which then
shows its empty state). Opens on hover, focus and chevron tap; Escape/leave closes. Mobile shows the same
list nested under "Danh mục".

## Auth

One login form for customers **and admins**: the backend's `/auth/login` answers with `actor`
(`Customer` or `Staff`) and the session stores a small `AuthUser {name, actor, role}`. The header
shows an "Admin" badge for staff. Refresh and logout use the same `/auth/*` endpoints for both. The
admin token is an Internal token: it works on `/api/v1/admins/**` and `/api/v1/me`, but the public
course endpoints still treat it as anonymous (no paid-video preview yet).

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

Add-on lessons (`includedInCourse: false`) render in their own group; owned = `(hasCourseAccess && includedInCourse) || lessonIds.includes(id)` in `CourseAccess.tsx`.
