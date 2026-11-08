# Plan 08: trial banner, and "Đăng ký thành công" for free orders

## Decisions (confirmed)

| | |
|---|---|
| Free order page | A Paid order with `amountVnd === 0` reads **"Đăng ký thành công"** / "Quyền truy cập đã được mở." instead of "Thanh toán thành công" / "Cảm ơn bạn! Quyền truy cập đã được mở." |
| Banner | One short line at the top of every page, above the header, not dismissible |
| Banner text (vi) | "Website đang chạy thử nghiệm, nội dung từ các nhóm Facebook đang được chuyển dần lên đây. Tin mới nhất và hỗ trợ: **Facebook Chef Phương Lan Đoàn**." The bold part links to Chef Lan's page (`contact.social` item with `chef: true`), new tab, `rel="noopener noreferrer"` |
| Banner text (en) | "This website is in trial: content from our Facebook groups is being moved here step by step. Latest news and help: **Chef Phương Lan Đoàn on Facebook**." |

## Build

1. Dictionaries (`vi.json`, `en.json`, same keys): `checkout.freeTitle`, `checkout.freeText`; `banner.text`, `banner.link`
   (the text holds a `{link}` placeholder or is split into before/link parts; keep it simple).
2. `CheckoutView`: the Paid state uses the free strings when `order.amountVnd === 0`.
3. `src/components/TrialBanner.tsx` (server component): small text (`text-sm`), centered, padded `py-2 px-4`, a background that
   stands apart from the header but fits the palette (for example `bg-terracotta/90 text-beige`), wraps on phones with no
   horizontal scroll. Rendered in `app/[lang]/layout.tsx` above the sticky header (it scrolls away; the header stays sticky).
4. Tests: e2e that the banner and its Facebook link show on the home page; the free-order test expects "Đăng ký thành công".

## Done when

`pnpm typecheck`, `pnpm eslint src tests`, `pnpm build` (no API), `pnpm test:e2e` twice, all clean. Implementation notes here.

## Implementation notes

- Dictionaries: `banner.text` (ends before the link, no trailing space) + `banner.link`; the component adds a space before and a "." after the link.
  `checkout.freeTitle` / `checkout.freeText` added in both languages.
- `TrialBanner` (`src/components/TrialBanner.tsx`): `<div className="bg-terracotta/90 px-4 py-2 text-center text-sm text-beige">`, the link finds the
  `contact.social` item with `chef: true`; opens in a new tab with `rel="noopener noreferrer"`, `font-semibold underline`. Rendered in
  `app/[lang]/layout.tsx` before the header's Suspense, so it scrolls away and the header stays sticky. Wraps on phones.
- `CheckoutView` Paid state: `order.amountVnd === 0` picks the free strings.
- Tests: new banner test in `home.spec.ts`; the free-order test in `checkout.spec.ts` expects `freeTitle` / `freeText`.
- Verified: typecheck, `eslint src tests`, `pnpm build` (no API), `pnpm test:e2e` twice (72 passed each).
