# Plan 09: profile completion gate, legal pages removed

Context and decisions: `../chef-lan/docs/customer-profile/spec.md`.

## Web (`chef-lan-web`): `docs/plans/09-profile-completion-no-legal.md`

1. `lib/api/types.ts`: `Customer` gets `provinceCode`, `profileComplete`; `AuthProvider` keeps them on `AuthUser` and refreshes
   the user from `GET /api/v1/me` once after restoring a saved session (old sessions lack the fields).
2. `/account/profile` page: Tên, email (read-only), SĐT, Tỉnh/thành select (from `/api/v1/provinces`), Save → `PUT /me/profile`,
   update the session user, then go to `next` (same-origin check as `AuthForm`) or `/account/courses`. Link in the account
   menu ("Thông tin cá nhân").
3. **Gate:** a small client component in the layout: a signed-in **customer** with `profileComplete === false` on any page
   other than `/account/profile` is sent there with `?next=<current path>`. Login and activation (`AuthForm`, `ActivateView`)
   go straight to the profile page when incomplete. Staff and anonymous visitors are never gated.
4. **Remove legal pages:** `app/[lang]/terms|privacy|refund`, `content/legal.ts`, `LegalPage.tsx`, the footer links, the
   sitemap entries, their dictionary keys and tests.
5. Tests: mock API gains `/provinces`, `/me/profile`, a customer with an incomplete profile; e2e for the gate, saving the
   profile, and the legal routes being gone (404).

## Done when

`pnpm typecheck`, `pnpm eslint src tests`, `pnpm build` (no API), `pnpm test:e2e` twice, clean. Add implementation notes here.

## Implementation notes

- `AuthUser` (customers) now carries `email`, `phone`, `provinceCode`, `profileComplete`. `profileComplete === undefined` means unknown
  (session saved before this plan): `restore()` asks `GET /api/v1/me` once and stores the answer; the gate does nothing while unknown.
  `AuthResult` ok-variants now carry `user`, so `AuthForm`/`ActivateView` can route straight to the profile page.
  `AuthProvider.updateCustomer(customer)` replaces the stored user after `PUT /me/profile`.
- Gate: `src/lib/auth/ProfileGate.tsx`, mounted in `app/[lang]/layout.tsx` in its own `<Suspense fallback={null}>`. It renders nothing
  (server HTML unchanged) and redirects from an effect with `router.replace`, never on `/account/profile`, `/login`, `/activate`
  (locale prefix stripped first). `next` = current pathname + query; hash is dropped.
- `/account/profile` (`ProfileView`): name, read-only email, phone, native `<select>` of provinces from `GET /provinces` (fetched in the
  browser, aborted on cleanup). Client checks mirror the backend (phone: spaces/dots stripped, `^\+?[0-9]{9,15}$`); 400 field errors map
  from `FullName/Phone/ProvinceCode`. After saving it goes to a same-origin `next` (not the profile page itself) or `/account/courses`.
  Staff see a notice; anonymous visitors go to login. Menu item "Thông tin cá nhân" for customers only.
- `safeNext` moved from `AuthForm` into `profileRedirect.ts`; `apiFetch` accepts `PUT`.
- Legal pages, `content/legal.ts`, `LegalPage`, footer links, sitemap entries and the `footer.terms|privacy|refund|updated` keys are removed.
  `Footer` no longer takes `lang`.
- Mock API: `/provinces`, `/me`, `PUT /me/profile`, customers `incomplete1..8@test.dev` (one per test: the mock keeps the saved profile).
  New `tests/e2e/profile.spec.ts`; `seo.spec.ts` asserts the legal routes 404; `/terms` dropped from the routing spec.
- Status: typecheck, `eslint src tests`, `pnpm build` (no API), `pnpm test:e2e` (71 tests, twice) all clean.
