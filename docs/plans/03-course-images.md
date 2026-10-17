# W3 — Course image gallery

Context: `../chef-lan/docs/course-images/spec.md`. Needs backend B2 (`images` on the course detail, `cardImageUrl` on
list items). Shapes: implementation notes at the end of `../chef-lan/docs/course-images/plans/02-course-images.md`.

1. **Cards** (`CourseCard`, `MyCoursesView`): use `cardImageUrl` (falls back to `thumbnailUrl` server-side already).
   Hero (`HeroSlider`) keeps `thumbnailUrl` — do not change it.
2. **Course page**: replace the single image in the hero column with a carousel of `images` (fallback: one slide with
   `thumbnailUrl`, or the existing gradient placeholder). Reuse `src/components/Carousel.tsx` (embla). Keep the 4:3
   frame so the layout does not change; `object-cover`. Arrows + dots only when there is more than one image; swipe on
   touch; no autoplay. `alt` from the image (fallback: course title). First slide `loading="eager"`, the rest lazy.
   Optional: small thumbnails row under the carousel when ≥ 3 images (skip if it complicates the layout).
3. Use `width`/`height` when present for `sizes`/aspect hints; the frame stays 4:3 regardless.
4. vi/en labels for the carousel controls ("Ảnh trước", "Ảnh sau", "Ảnh {n}").

Done when: a course with 3 images shows a working carousel (arrows, dots, swipe on mobile width), the card shows the
first image; a course without images shows its cover on both; the homepage hero still uses the cover image.
`pnpm lint`, `pnpm typecheck`, `pnpm build` clean.

## Implementation notes

Status: done (lint, typecheck, build clean; not browser-tested).

- Types: `CourseListItem.cardImageUrl`, `MyCourse.cardImageUrl`, `CourseImage`, `CourseDetail.images`.
- `CourseCard` / `MyCoursesView` use `cardImageUrl ?? thumbnailUrl`; `HeroSlider` untouched.
- Course page: 2+ images render `Carousel` inside the existing 4:3 frame (arrows from sm up, dots overlaid at the bottom of the
  frame, swipe, no autoplay, no loop); first slide eager. 0 or 1 image renders a single `Thumbnail` (first image, else
  `thumbnailUrl`, else the gradient). Alt = image alt, else course title.
- `Carousel` gained an optional `dotsClassName` (default `mt-4`, so existing uses are unchanged).
- i18n keys `course.gallery`, `imagePrev`, `imageNext`, `imageGoTo` (dots read "Ảnh 2"/"Image 2").
- Skipped: thumbnails row; `width`/`height` are typed but unused (the frame is fixed 4:3, `fill` needs no hints).
