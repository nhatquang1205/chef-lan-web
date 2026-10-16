# W1 — Hide registration, add the invitation activation page

Context and decisions: `../chef-lan/docs/customer-invitations/spec.md`. Needs backend plan **B3** deployed first
(`POST /api/v1/auth/invitations/inspect` and `/accept`).

## 1. Hide the register button (the API keeps working)

- `src/components/AuthForm.tsx`: on the **login** form, remove the "Đăng ký" link at the bottom (`dict.auth.registerLink`)
  and replace it with a short line: "Chưa có tài khoản? Liên hệ cô Lan để được tạo tài khoản." (add `auth.noAccountHint`
  in `vi.json` / `en.json`).
- Check every other place that links to `/register` (`grep -rn "/register" src`): header, account menu, course pages,
  watch/lesson "sign in" hints. Remove those links too.
- Keep `src/app/[lang]/register/page.tsx` and the register API as they are (decision: hide only). Add
  `robots: { index: false }` metadata to the register page so search engines stop showing it.

## 2. Activation page: `/[lang]/activate` (`/activate`, `/en/activate`)

Client component (tokens live in the browser), in the same style as the login page (`AuthForm` look):

1. Read the token from **`window.location.hash`** (`#token=...`), never from the query string. Immediately
   `history.replaceState` to drop the hash from the address bar.
2. No token → "Liên kết không hợp lệ" state.
3. `POST /api/v1/auth/invitations/inspect { token }` → show "Xin chào {fullName}", the email (read-only), and the form:
   new password + confirm (≥ 8 chars, must match, show/hide toggle like the login form).
   `400 customer.invite_invalid` → state "Liên kết đã hết hạn hoặc đã được sử dụng. Liên hệ cô Lan để nhận liên kết mới."
   with the contact phone and a link to `/login`.
4. Submit → `POST /api/v1/auth/invitations/accept { token, password }` → the response is the normal session: store it
   through the existing `AuthProvider` (add a method next to `login`, e.g. `acceptInvite(token, password)`, that calls
   the API and runs the same `applySession`), then go to the customer's courses page `/account/courses` with a
   short success message "Tài khoản đã được kích hoạt".
5. Already signed in as a customer when opening the link → still show the form (it may be someone else's invite);
   accepting replaces the session.
6. 429 → the existing "too many attempts" text. Page metadata: `robots noindex`, title "Kích hoạt tài khoản".
7. vi/en strings under a new `activate` group in both dictionaries.

## Done when

- No visible link to `/register` anywhere on the site; `/register` still works when typed.
- With a real invite from the local backend (B3): the mail link opens `/activate#token=...`, the hash disappears from
  the address bar, the name/email show, a mismatching confirm is refused client-side, a valid password signs in and
  lands on `/account/courses`; reopening the same link shows the expired/used state.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` clean.
