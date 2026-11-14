# Plan 11: mobile header shows login / name, menus close properly, no "Buy now" flash for owners

Why: on a phone the login button is hidden inside the ☰ menu, so people do not find it. The ☰ menu stays open when you tap
somewhere else, and tapping an account link inside it does not close it. On a course page the viewer already owns, "Mua ngay"
shows for a moment and then disappears.

## Decisions (confirmed)

| | |
|---|---|
| Mobile header, signed out | The login button sits in the header bar next to ☰ (same style as desktop, a bit smaller to fit 375 px) and is no longer in the menu |
| Mobile header, signed in | The user's name (truncated, plus the admin badge for staff) shows in the bar next to ☰. **Display only**: not a button, no dropdown. The account links (Khoá học của tôi, Đơn hàng, Lịch sử, Thông tin cá nhân, Đăng xuất) stay in the ☰ menu |
| Closing the ☰ menu | Closes on: a tap/click anywhere outside the menu and its ☰ button, a tap on **any** link or button inside it (nav, categories, language, account links, logout), Escape, and any route change |
| Desktop dropdowns | Categories and the account dropdown also close on a tap/click outside (touch tablets can open them by tapping the chevron / name and had no way to close them except tapping again) |
| Buy-now flash | `BuyNote` renders nothing until the viewer's access is known (`ready`), then shows the button only if the course is not owned. While waiting it keeps the button's height (an invisible placeholder) so the page does not jump |

## Build

1. `src/components/SiteHeader.tsx`:
   - A mobile-only (`md:hidden`) area between the logo and ☰: signed out = the login link; signed in = the name (+ admin badge),
     `truncate` with a max width so the logo and ☰ always fit at 375 px; loading = a small fixed-size placeholder (as today).
   - The ☰ menu no longer renders the login link. When signed in it still renders the account links (`AccountMenu inline`); the
     name heading inside the inline list can go, since the name is now in the bar.
   - Outside-click: one `pointerdown` listener on `document` while the menu is open, ignoring events inside the menu panel or
     the ☰ button (refs). Escape closes. Remove the `stopPropagation` on the account/language row, so every click on a link or
     button inside the panel closes it (the existing `onClick={() => setOpen(false)}` on the panel then covers all of them).
     Close on `pathname` change too (in an effect keyed on `pathname`, or by resetting state during render on change).
   - Same outside-`pointerdown` close for the desktop Categories dropdown.
2. `src/components/AccountMenu.tsx`: outside-`pointerdown` close for the desktop dropdown. Keep the inline variant's links;
   tapping logout or a link must close the ☰ menu (it will, once the stopPropagation is gone).
   A small shared hook (e.g. `src/lib/useOutsideClose.ts`: `(open, refs, close)`) is fine if it keeps the three places simple.
3. `src/components/CourseAccess.tsx` `BuyNote`: read `ready` from the context; `!ready` → an `aria-hidden` invisible block of the
   button's height; ready and `hasCourseAccess` → nothing; otherwise the button. Check the server HTML: auth is `loading` on the
   server, so the server render must be the placeholder, not the button.
4. Tests (`tests/e2e`, mock API): at a 375 px viewport, signed out: the login link is visible in the header without opening ☰;
   signed in: the name is visible in the header; ☰ open → tap outside closes it; ☰ open → tap an account link closes it and
   navigates; Escape closes it. Course page of an owned course: the Buy button never appears (e.g. assert it is not in the
   server HTML and not visible after load). Existing header/auth tests updated where they opened ☰ to log in.

## Done when

`pnpm typecheck`, `pnpm eslint src tests`, `pnpm build` (no API), `pnpm test:e2e` twice, clean. Implementation notes added here.

## Implementation notes

Files changed: `src/lib/useOutsideClose.ts` (new), `src/components/SiteHeader.tsx`, `src/components/AccountMenu.tsx`,
`src/components/CourseAccess.tsx`, `tests/e2e/mobile-header.spec.ts` (new). No new dictionary keys.

- Header: a `md:hidden` area before the ☰ button shows the login link (smaller) or the name + admin badge (`max-w-40`, truncated,
  a `<p>`, not a button) or a small placeholder while loading. The ☰ menu no longer has the login link; signed in it lists the
  account links via `AccountMenu inline` (the name heading there was removed). `renderAccount` is desktop-only now.
- Closing: `useOutsideClose(open, refs, close)` adds one `pointerdown` listener on `document` while open and calls `close` when the
  target is outside every ref. Used for the ☰ menu (panel + ☰ button refs), the Categories dropdown and the desktop account
  dropdown. Escape closes the ☰ menu (document keydown while open). The `stopPropagation` on the account/language row is gone, so
  the panel's `onClick` closes it for every link/button. A route change closes it (pathname compared during render).
- `BuyNote`: not `ready` -> `aria-hidden` invisible `h-12` block (the button's height); owned -> nothing; else the button. Auth is
  `loading` on the server, so the server HTML has the placeholder.
- Tests (`mobile-header.spec.ts`, 375 px): login link in the bar, not duplicated in the menu, no horizontal scroll; name in the bar
  with no account button; tap outside closes; Escape closes; account link closes the menu and navigates; owned course page has no
  `>Mua ngay</button>` in the server HTML and no Buy button / not-owned marks after load. (The dictionary is part of the page
  payload, so the text alone is in the HTML; the test looks for the rendered button.) Existing tests needed no change (desktop viewport).
- Verification: `pnpm typecheck`, `pnpm eslint src tests`, `pnpm build` clean; `pnpm test:e2e` 79 passed, twice.
