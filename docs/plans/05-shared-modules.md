# Plan 05: shared modules on the site

Context: `../chef-lan/docs/included-courses/plans/04-shared-module-flag.md` (needs that plan). `GET /api/v1/courses` no longer returns
shared modules. `GET /api/v1/shared-modules` takes the same parameters and returns the same paged shape.

## Build

1. `lib/api/catalog.ts`: `listLandingSharedModules(pageSize)`, cached like `listLandingCourses`, returning the items and `totalCount`.
   `searchCourses` takes `shared?: boolean` and then calls the new endpoint, not cached either.
2. Home, last section after the categories: heading "Học phần chung", the 6 newest in the usual cards, and a "Xem tất cả" link to
   `/courses?type=shared`. No paging on the home page. Hidden when there are none; an API failure must not break the page. Same
   Suspense and `connection()` pattern as the sections beside it. Reuse the look of `CategorySection`.
3. `/courses`: a new "Loại" filter in the form with "Khóa học" (default) and "Học phần chung", URL `type=shared`, validated like the
   other values. It combines with search, category and sort, is kept by `hrefFor`, counts as a filter for the clear link, and a shared
   view says so in the header.
4. `sitemap.ts`: list both endpoints, so shared module pages stay in the sitemap.
5. `vi.json`, `en.json`. `tests/mock-api.mjs` and the e2e suite: add the endpoint and cover the home section and the filter.

## Done when

`pnpm eslint src tests`, `pnpm typecheck`, `pnpm build` (without the API) and `pnpm test:e2e` all pass. In the browser against the local
API: a shared module is absent from hero, category sections and the default /courses; it shows in the last home section; "Xem tất cả"
opens the filtered list; search works inside the filter; paging keeps the filter; its detail page opens; 375 px holds.

## Implementation notes

- Done. `pnpm eslint src tests`, `pnpm typecheck`, `pnpm build` (API stopped) and `pnpm test:e2e` (58 tests) pass.
- `CategorySection` now takes `id`, `title`, `href` and `linkLabel` instead of a `Category`, so the home page reuses it for "Học phần chung" (`#shared-modules`, 6 newest, link to `/courses?type=shared`). The section renders nothing when the list is empty or the API fails.
- `/courses`: the "Loại" select is `type` (`""` = courses, `shared`); any other value is ignored. The header says "Đang xem: học phần chung" in the shared view. The filter grid gained a fifth column on large screens.
- `searchCourses({ shared: true })` calls `/api/v1/shared-modules`; the sitemap lists both endpoints, each in its own try/catch.
- Verified against the local API in the browser: hidden from the hero, category sections and the default list; shown in the last home section; "Xem tất cả" opens the filtered list; search works inside it; detail page opens; 375 px has no horizontal scroll. A customer owning a flagged course still gets it from `/api/v1/me/courses`. Paging keeping `type` was not exercised live (fewer than 12 shared modules exist); it is the same `hrefFor` line as the other filters.
