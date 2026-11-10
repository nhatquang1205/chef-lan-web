# Plan 10: shared modules first in the course outline

Why: on a course page the included shared modules ("Học phần: Nuôi men tự nhiên") come after the course's own lessons. They are
the foundation the course builds on, so they should always come first.

## Decisions (confirmed)

| | |
|---|---|
| Order | In "Nội dung khóa học": every included shared module first (in the API's order), then the course's own lessons, then add-on lessons (unchanged, last) |
| Own lessons heading | Only when the course has at least one shared module: an `h3` with the course title above its own lessons, styled like the module headings. A course without modules looks exactly as today |
| Numbering | Unchanged: each list numbers its own lessons from 1 |

## Build

`src/app/[lang]/courses/[slug]/page.tsx`: move the `course.includedCourses.map(...)` block above the `includedLessons` list; render
the course-title heading only when `course.includedCourses.length > 0`. No new dictionary key is needed (the heading is the course
title). Update the e2e test that checks the outline (mock course with a module) for the new order and the heading.

## Done when

`pnpm typecheck`, `pnpm eslint src tests`, `pnpm build` (no API), `pnpm test:e2e` twice, clean. Add implementation notes here.

## Implementation notes

- `page.tsx`: the `includedCourses` blocks now render first (first block `mt-4`, later ones `mt-10`), then a wrapper with the course's own
  `includedLessons`; an `h3` with `course.title` appears only when `hasModules`. Without modules the markup is unchanged. `renderLesson`,
  owned marks, locks and links are untouched; add-on lessons stay last.
- `tests/mock-api.mjs`: new course `with-module` (own lessons plus the `sauce-base` module with lesson "Sauce one").
- `tests/e2e/course.spec.ts`: checks module heading < module lesson < course-title heading < own lessons, and that `macaron` has no title heading.
- Verified: typecheck, eslint src tests, build with no API, `pnpm test:e2e` twice (all pass).
