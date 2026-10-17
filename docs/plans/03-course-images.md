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
