# Plan 06: personalised home page, client store, navbar, English hidden

Context: `../chef-lan/docs/my-catalog/spec.md` (the API) and `../chef-lan/docs/payments/plans/04-bank-transfer-switch.md`.
API: `GET /api/v1/me/catalog-state` (customer token) →
`{ ownedCourseIds: number[], prices: { courseId, listPriceVnd, finalPriceVnd }[] }`.

## Decisions (confirmed)

| | |
|---|---|
| Home page | For a signed-in customer: courses owned whole are hidden (hero slider, category sections, shared modules); a course with a reduced price shows the final price with the list price struck. A section left empty is hidden. `/courses` and course pages unchanged |
| Refresh | Fetch after login (forced) and when the stored copy is 30+ minutes old. Staff and anonymous: no fetch, nothing hidden. A course approved by staff may stay on the home page up to 30 minutes (accepted) |
| Storage | IndexedDB via `idb`. This is the pattern for future bookmarks, history and the like: document it in `docs/client-store.md` |
| Navbar | "Khóa học của tôi" after "Khóa học", signed-in customers only, to `/account/courses` (also stays in the account menu) |
| English | Hidden for this release: no VI/EN toggle, `/en` and `/en/...` redirect (temporary) to the Vietnamese page, sitemap `vi` only. Code and `en.json` stay |
| Bank transfer | Off in the API. `BuyButton` already hides the option when `/checkout/config` is disabled: dialog stays with one option, no code change but its doc comment |
| Contact order page | Hotline (`CONTACT_PHONE`, 0932 046 296) and Chef Lan's Facebook only; Mrs. Lan's number removed |

## Part A: client store and home page

1. `pnpm add idb`.
2. `src/lib/store/db.ts`: `openDB("cheflan", VERSION, { upgrade(db, oldVersion) { ... } })` typed with `DBSchema`, opened
   lazily once (browser only, never during SSR). Upgrades are additive steps (`if (oldVersion < 1) createObjectStore(...)`),
   never edited later. Store `catalogState`, keyPath `customerId`, value `{ customerId, fetchedAt, data }`. Every access is in
   try/catch: no IndexedDB (private mode, blocked) means "no record", never an error on screen.
3. `src/lib/store/syncedRecord.ts`: a small generic React hook used per feature, for example
   `useSyncedRecord({ store, userId, maxAgeMs, fetch })` returning `data | null`:
   - reads the record and shows it at once;
   - fetches when there is none or `Date.now() - fetchedAt >= maxAgeMs`, writes it, updates state;
   - `force` when the signed-in user changes from what this tab had (login, accept invite);
   - a `setTimeout` for `fetchedAt + maxAgeMs`;
   - on `visibilitychange` to visible: re-reads IndexedDB (another tab may have refreshed), then fetches if due;
   - a failed fetch keeps the stored copy and tries again at the next trigger;
   - a helper to delete a user's records, called on logout (AuthProvider `logout`).
   Keep it small: no BroadcastChannel, no library beyond `idb`.
4. `src/lib/api/myCourses.ts`: `getCatalogState(token)`; type `CatalogState` in `types.ts`.
5. `src/lib/catalogState/CatalogStateProvider.tsx` (client): uses the hook with `maxAgeMs = 30 * 60_000`, only when
   `auth.user?.actor === "Customer"` (token from `auth.getAccessToken()`). Exposes `useCatalogState()` →
   `{ isOwned(courseId): boolean, finalPriceOf(courseId): number | undefined }`, empty for anyone else. Mounted inside
   `AuthProvider` in `app/[lang]/layout.tsx`.
6. `features/landing/HeroSlider.tsx` and `CategorySection.tsx` become client components: filter out `isOwned` courses, return
   `null` if none are left. Pass only the strings they need, not the whole dictionary. `app/[lang]/page.tsx` keeps its cached
   server fetching and `connection()` exactly as is.
7. `CourseCard`: optional `finalPriceVnd`. When below `priceVnd`: show `formatVnd(finalPriceVnd)` with `priceVnd` struck
   (instead of `compareAtPriceVnd`). The hero price does the same. `/courses` passes nothing, so it is unchanged.
8. `docs/client-store.md`: why IndexedDB (personal data, server pages cached for all), the database and its version steps,
   per-account records and logout cleanup, the refresh triggers, how to add a feature (bookmarks, history: new store in a new
   version step + a provider using the hook), what must never be stored there (tokens, signed video links, anything
   secret). Link it from `CLAUDE.md`.

## Part B: navbar, English, contact page, tests

1. `SiteHeader.tsx`: item `myCourses` (`dict.nav.myCourses`) after `courses`, only when `hydrated && auth.user?.actor ===
   "Customer"`, active on `/account/courses`, desktop and mobile.
2. `i18n/config.ts`: `export const publicLocales: readonly Locale[] = ["vi"]`. `LanguageToggle` renders nothing when
   `publicLocales.length < 2` (desktop and mobile). `sitemap.ts`: alternates from `publicLocales`. `next.config.ts`
   `redirects()`: `/en` → `/` and `/en/:path*` → `/:path*`, `permanent: false`, only while `en` is not in `publicLocales`.
   Read `CLAUDE.md` "i18n" first: never redirect `/vi/...`, and test with `pnpm build && pnpm start` plus the nginx headers.
3. `CheckoutView.tsx` contact panel: replace `contact.phones.map` with the Hotline only (`CONTACT_PHONE`); keep the Facebook
   item. `BuyButton`: update the doc comment (transfer off for now, the option appears again when the API enables it).
4. Tests: `tests/mock-api.mjs` serves `/api/v1/me/catalog-state` (one owned course, one discounted course). E2E: owned course
   gone from home, discounted price with list price struck, anonymous sees all, navbar item for customers only, `/en/courses`
   → `/courses`, contact order page shows the Hotline and not 0775 965 143.

## Done when

`pnpm typecheck`, `pnpm eslint src tests`, `pnpm build` (API stopped) and `pnpm test:e2e` clean. In the browser against the
local API: one `catalog-state` request after login, none on reload within 30 minutes (data from IndexedDB), a fetch again
after setting `fetchedAt` back 31 minutes, record deleted on logout; home hides owned courses and shows the discount; navbar
item; no toggle; `/en` → `/`; contact page; 375 px holds. Add implementation notes here.

## Implementation notes

- Done as planned. The store is `src/lib/store/{db,syncedRecord}.ts`, the provider `src/lib/catalogState/CatalogStateProvider.tsx`;
  docs in `docs/client-store.md`.
- `useSyncedRecord` takes `userId: number | null | undefined` (undefined = session still loading) so a page reload with a saved
  session is not mistaken for a login; only signed-out -> customer or customer -> other customer forces a fetch.
- `Carousel` now calls `embla.reInit()` when its slide count changes (slides are filtered after mount).
- `CourseCard`/`formatDuration` take `Pick<Dictionary, ...>`, and `app/[lang]/page.tsx` passes the client sections only the strings
  they use. The home page flashes the full list for an instant before IndexedDB answers.
- List totals: course cards show `totalLessonCount` / `totalDurationSecondsWithIncluded` (fall back to the own counts); backend plan `chef-lan/docs/included-courses/plans/05-list-totals.md`; the mock gives Macaron 5 lessons / 1 h 20 and `home.spec.ts` asserts the card.
- `/en` redirects are 307 (temporary); `redirects()` is skipped if `"en"` is in `publicLocales`.
- The contact panel's hotline label is the literal "Hotline".
- Tests: `tests/e2e/home.spec.ts` (new), routing/seo/checkout specs updated; the mock has `catalog@test.dev` (own request counter).
- Review fix: `useCatalogState()` returns the empty value until the component has hydrated (`useSyncExternalStore`, server
  snapshot false). Without it, a home section streamed in after the provider already held the data (login redirect, or a
  client navigation back home) rendered `null` on the client while the server HTML had the section: a hydration error.
- Verified in the browser against the local API (web 3001, API with `Cors__AllowedOrigins__0=http://localhost:3001`): one
  `catalog-state` GET after login and none on reload; a fetch again after moving `fetchedAt` back 31 minutes; the owned
  shared module's section disappears and a parent course shows 500.000 ₫ with 600.000 ₫ struck; navbar item on desktop and
  mobile; no language toggle; `/en/courses` → `/courses`; the contact order page shows the Hotline and Chef Lan's Facebook
  only; 375 px has no horizontal scroll; logout leaves no record in IndexedDB.
