# Plan 07: free courses, and "Đã sở hữu" instead of hiding owned courses

Context: `../chef-lan/docs/payments/plans/05-free-courses.md` (a course priced 0: `POST /api/v1/orders` with `ContactChef`
returns the order already `Paid` and access is granted). Plan 06 (personalised home) is changed: owned courses are no longer
hidden, they are labelled.

## Decisions (confirmed)

| | |
|---|---|
| Free display | Wherever a course price shows (cards, hero, course page price block), `priceVnd === 0` reads **"Miễn phí"** (`dict.common.free`) instead of "0 ₫", with no struck compare-at price |
| Free flow | Unchanged steps: Buy now → dialog → "Liên hệ trực tiếp Chef Lan" → order created → `/checkout/{code}`, which shows the Paid state and the way into the course |
| Owned courses | Shown, not hidden, on the home page **and** `/courses`. The price line is replaced by "✓ Đã sở hữu" (small check icon + text; no price, no discount) |
| Discounted price | Same component, so `/courses` cards also show the reduced price (was home only) |
| After a purchase | When an order the customer is looking at becomes Paid (free order at once, or a contact order approved while the page polls), the catalog state is refreshed at once instead of waiting up to 30 minutes |

## Build

1. `src/components/CoursePrice.tsx` (client): props `course` (`priceVnd`, `priceDisplay`, `compareAtPriceVnd`, `id`), a
   `size`/class variant for card vs hero. Uses `useCatalogState()`:
   - owned → check icon + `dict.card.owned` ("Đã sở hữu"; en "Owned");
   - `priceVnd === 0` → `dict.common.free`;
   - reduced (`finalPriceOf`) → final price + struck list price;
   - otherwise today's price + struck compare-at.
   Dictionary strings passed in as props (only the few needed), as the sections do now.
2. `CourseCard` renders `CoursePrice` for its price line; drop the `finalPriceVnd` prop. It stays usable from server pages
   (`/courses`) because only `CoursePrice` is a client component.
3. `HeroSlider`: no filtering; its price uses `CoursePrice` (hero size). `CategorySection`: no filtering, no "return null when
   empty". They may go back to server components if nothing else needs the client; keep passing only the needed strings.
4. Course page (`app/[lang]/courses/[slug]/page.tsx` and its price block / `BuyButton` area): price 0 shows "Miễn phí". The
   existing owner logic (no Buy button for owners) is unchanged.
5. `CatalogStateProvider`: expose `refresh()` (forced fetch through the hook; add a `refresh` to `useSyncedRecord`, documented in
   `docs/client-store.md` as part of the pattern). Call it from `BuyButton` when the created order comes back `Paid`, and from
   `CheckoutView` when its polling sees the order turn `Paid`.
6. Docs: `docs/plans/06-personalised-home.md` gets a line "owned courses are labelled, not hidden (plan 07)"; update the
   decision table there; `docs/client-store.md` (refresh).
7. Tests (`tests/mock-api.mjs` + e2e): a mock course priced 0 shows "Miễn phí" on its card and course page; the free order flow
   lands on a Paid order page; the owner sees "Đã sở hữu" on the owned card on home and `/courses` (instead of it being hidden)
   and no price on it; update the plan-06 tests that asserted hiding.

## Done when

`pnpm typecheck`, `pnpm eslint src tests`, `pnpm build` (API stopped), `pnpm test:e2e` clean (run twice). Browser against the
local API: free course card/page say "Miễn phí"; Buy now → contact → Paid page → course plays, and home shows it "Đã sở hữu"
without waiting; an owned course is labelled on home and `/courses`; no hydration errors in the console; 375 px holds.

## Implementation notes

- `CoursePrice` (client) takes `course` (`id`, `priceVnd`, `priceDisplay`, `compareAtPriceVnd`), `dict: PriceDict` and
  `size: "card" | "hero"`. `PriceDict` and `priceDict(dict)` live in `src/lib/priceDict.ts` (not in the client file: a server page
  cannot call a function exported from a `"use client"` module). New string `card.owned` in both dictionaries; `common.free` existed.
- `HeroSlider` and `CategorySection` are server components again; `HeroSlider` returns null for an empty list. `CourseCard` lost
  `finalPriceVnd`; its `dict` now also needs `common.free` and `card.owned`.
- `useSyncedRecord` returns `{ data, refresh }`. `refresh()` sets the force flag and runs the load; if a fetch is in flight it is
  repeated after it ends. `CatalogStateProvider` exposes it as `useCatalogState().refresh`.
- Course page: price 0 reads "Miễn phí" in the server-rendered block (the `DiscountQuote` wrapper is unchanged).
- Mock: `free-class` (id 3, price 0) with its own order path (201, `Paid`, amount 0, `payment: null`), access and catalog state;
  `buyer10` added for the free-order test. The hero now shows a struck compare-at price too (it uses the shared component), so the
  anonymous home test counts 3 `<s>` instead of 2.

