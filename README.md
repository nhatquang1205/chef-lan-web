# chef-lan-web

Customer storefront for chef Lan's online cooking courses (brand: **Bon Bocon**). Next.js 16
(App Router, Cache Components), TypeScript, Tailwind CSS 4. Talks to the `chef-lan` backend.

## Run

```bash
pnpm install
cp .env.example .env.local     # API_BASE_URL / NEXT_PUBLIC_API_BASE_URL -> the backend
pnpm dev                       # http://localhost:3000
```

The backend must be running (`make run` in `chef-lan`, port 5059) and must list
`http://localhost:3000` in `Cors:AllowedOrigins` (already set in its
`appsettings.Development.json`), otherwise login and register fail in the browser.

| Script | |
|---|---|
| `pnpm dev` / `build` / `start` | run / production build / serve the build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | route types + `tsc --noEmit` |

## Pages

| URL | |
|---|---|
| `/` | hero slider (newest courses) + one carousel per category, "Show more" -> `/courses?category=` |
| `/courses` | list with search, category, level, sort, paging — all in the URL |
| `/courses/{slug}` | course page: outline, free preview links |
| `/login`, `/register` | customer auth |

Vietnamese is at the bare path, English under `/en` (`/en/courses`). Toggle in the nav bar.

Out of scope for now: my courses, enrollment, playback, checkout.

See `CLAUDE.md` for the conventions that are easy to get wrong.
