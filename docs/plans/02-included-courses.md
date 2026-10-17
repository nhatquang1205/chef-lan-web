# W2 — Included courses (shared modules) on the website

Context: `../chef-lan/docs/included-courses/spec.md`. Needs backend B2 (and B3 for the discounted price line).
API shapes: read the implementation notes at the end of `../chef-lan/docs/included-courses/plans/02-*.md` and `03-*.md`.

## Course page (`src/app/[lang]/courses/[slug]/page.tsx`)

1. Facts box and outline header use the totals that include the included courses (`totalLessonCount`,
   `totalDurationSecondsWithIncluded`).
2. Outline: after the course's own lessons (before the add-on group), one section per included course:
   heading "Học phần: {title}" with a short line "Học phần dùng chung, cũng có trong khóa khác" and its lessons rendered
   like the own lessons, but each "Chi tiết" links to `/courses/{includedSlug}/lessons/{lessonSlug}`.
3. Ownership marks: extend `CourseAccess.tsx` so an included course's lessons count as owned when the access response's
   `includedCourses[].hasCourseAccess` is true (or the lesson id is in its `lessonIds`). Keep the existing "not owned"
   badge behaviour.
4. Price box for a signed-in customer with a `quote` in the access response: original price struck through, the final
   price, and one line per discount ("Bạn đã có khóa Nuôi men tự nhiên: −300.000 ₫"). Hide when there is no quote.
   The server-rendered price stays as it is for everyone else (no layout jump: render the discount block inside the
   existing price box, below the price).
5. A shared course's own page (`includedIn` non-empty): small line under the subtitle "Có trong khóa: Panettone, Bánh mì
   hoa cúc" with links.

vi/en strings in both dictionaries. Match existing style (double quotes, semicolons).

## Done when

With local data (P includes C, a customer owning C, another owning P): P's page shows C's section with working lesson
links; owner of P sees C's lessons as owned and can play them; owner of C sees the discounted price on P; anonymous sees
the plain price; C's page shows "Có trong khóa". `pnpm lint`, `pnpm typecheck`, `pnpm build` clean.

## Implementation notes (done)

- `types.ts`: `CourseDetail` gains `includedCourses`, `includedIn`, `totalLessonCount`, `totalDurationSecondsWithIncluded`; `CourseAccess` gains `includedCourses` and `quote` (`CourseQuote`).
- `page.tsx`: facts box and outline header use the with-included totals; one "Học phần: {title}" section per included course between own lessons and add-ons, "Chi tiết" links to the included course's own lesson URL; "Có trong khóa:" links under the subtitle.
- `CourseAccess.tsx`: `NotOwnedBadge` takes `includedCourseSlug` and then reads `includedCourses[slug]` (`hasCourseAccess` or `lessonIds`). New `DiscountQuote` (struck list price, final price, one line per discount) renders inside the price box only when the quote has discounts.
- Deviation: `CourseAccessProvider` now wraps the whole article instead of only the outline, so the price box (`DiscountQuote`) and `BuyNote` see the access data. This also makes `BuyNote` hide for course owners, which it could not before (it sat outside the provider).
- Staff: the API returns `hasCourseAccess: true` for every included course, so nothing is marked "not owned"; quote is null.
- Not tested in a browser; lint, typecheck and build (API not running) are clean.
