# Plan 12: course gallery images load at once, not when swiped to

Why: on the course page the gallery (Carousel of `course.images`) renders every slide but the 2nd and later images use
`loading="lazy"`. They sit off to the side inside an `overflow-hidden` viewport, so the browser does not fetch them until the
visitor swipes to them, and then they appear slowly. (The other half of the slowness, images served from B2 in the US, is fixed
in the API repo by putting Cloudflare in front: chef-lan `docs/deploy-api/plans/10-image-cdn.md`.)

## Decisions (confirmed)

| | |
|---|---|
| Gallery | First image as today (eager, high priority). Every other gallery image `loading="eager"` with `fetchPriority="low"`, so they download right after the first one without competing with it |
| Elsewhere | Unchanged: course cards, home rows and the hero keep their current loading |

## Build

1. `src/components/Thumbnail.tsx`: let callers choose eager loading without high priority (e.g. an optional
   `loading?: "eager" | "lazy"` prop that overrides the one derived from `priority`; `fetchPriority` stays `high` only with
   `priority`, otherwise `low` when eager-but-not-priority, else `auto`). Keep the existing behaviour for every current caller.
2. `src/app/[lang]/courses/[slug]/page.tsx`: in the gallery `course.images.map`, index 0 keeps `priority`, the others pass
   `loading="eager"`.
3. Test: in `tests/e2e/course.spec.ts` (a mock course with 2+ images), every gallery `img` has `loading="eager"` in the page,
   the first has `fetchpriority="high"`, the others `fetchpriority="low"`. Add a second image to a mock course if none has one.

## Done when

`pnpm typecheck`, `pnpm eslint src tests`, `pnpm build` (no API), `pnpm test:e2e` twice, clean. Implementation notes added here.

## Implementation notes


- `Thumbnail` got an optional `loading` prop that overrides the one derived from `priority`; `fetchPriority` is `high` with `priority`, `low` when eager without it, else `auto`. Other callers are unchanged.
- Course page: gallery index 0 keeps `priority`; the others pass `loading="eager"`.
- Mock API: `with-module` now has 3 gallery images (data-URI pixels, distinct fragments); no other mock course changed.
- Test in `course.spec.ts`: all gallery images `loading=eager`, first `fetchpriority=high`, others `low`.
- Verified: typecheck, eslint, build (no API) and `test:e2e` twice (80 passed each), all clean.
