# Plan 04: two ways to buy

Context: `../chef-lan/docs/payments/plans/02-contact-orders-and-admin-list.md` (needs that plan). `POST /api/v1/orders` takes
`method: "BankTransfer" | "ContactChef"` (default BankTransfer); orders carry `paymentMethod`; a contact order has no
`payment` and works when `/checkout/config` says disabled.

## Build

1. `lib/api/types.ts`, `lib/api/orders.ts`: `OrderPaymentMethod`, `Order.paymentMethod`, `createOrder(token, target, method)`.
2. `lib/contact.ts`: move the phones and social links out of `Footer.tsx` and `CONTACT_PHONE` out of `ActivateView.tsx`, and
   use it in both. Numbers and links stay exactly as they are.
3. `BuyButton`: always renders, because contacting chef Lan needs no SePay. `useCheckoutEnabled` now only decides whether
   the transfer option shows (hidden while unknown or false).
   - Signed out: to login with `next`, as today.
   - Signed in: a native `<dialog>` (`showModal`, Esc and backdrop close, focus returns; add no library) titled
     "Chọn cách thanh toán" with two large option buttons:
     1. "Liên hệ trực tiếp Chef Lan": "Tạo đơn hàng rồi nhắn Chef Lan để được hướng dẫn thanh toán."
     2. "Chuyển khoản": "Quét mã QR bằng ứng dụng ngân hàng, khóa học tự động được mở."
   - Choosing creates the order and goes to `/checkout/{code}`. Existing errors stay, shown inside the dialog.
4. `BuyNote`: remove the "contact chef Lan" line beside the button, now redundant, along with the dictionary key if nothing
   else uses it. Fix the doc comment.
5. `CheckoutView`, Pending with `paymentMethod === "ContactChef"`:
   - Title "Đơn hàng {code}", the same item summary.
   - A panel: "Liên hệ Chef Lan và đọc mã đơn {code} để được hướng dẫn thanh toán. Chef Lan xác nhận xong, khóa học sẽ tự mở
     tại đây." Phone links for both numbers and the Facebook link, the code shown prominently.
   - Replace the mm:ss countdown with "Đơn được giữ đến {date}".
   - Polling, Paid, Cancelled and the cancel button stay shared. The Expired text must not mention a transfer for this method.
6. `OrdersView`: for a pending contact order the status reads "Chờ Chef Lan xác nhận" and the link reads "Xem đơn".
7. `vi.json` and `en.json`.

## Done when

`pnpm lint`, `pnpm typecheck`, `pnpm build` clean. In the browser against the local API on 5061 (web on 3001): with SePay off
only the contact option shows; the order page shows the contact details; approving by `mark-paid` flips the open page to
Paid within a poll and unlocks the course; a lesson purchase works the same; Esc closes the dialog; 375 px layout holds.
Add implementation notes here.

## Implementation notes

Done as planned. Where it differs or is worth knowing:

- `lib/contact.ts` exports `contact` (email, phones, social: moved verbatim from the footer), `CONTACT_PHONE` (the first phone, as `ActivateView` had it) and a `telHref` helper. The checkout contact panel shows both phones and only the Facebook link (not Instagram), as the plan lists.
- `BuyButton` renders the dialog only for a signed-in viewer; the `<dialog>` is opened with `showModal()` from the click handler, so no state mirrors its open flag. A backdrop click is detected as a click whose target is the dialog element itself. The transfer option is hidden until `/checkout/config` says enabled. A close "x" button was added for pointer users.
- `BuyNote` is now just the button; `course.buyNote` was removed from both dictionaries. Added: `checkout.chooseMethod`, `close`, `option*`, `contact*`, `heldUntil`, `expiredContactText`, `account.awaitingChef`, `account.viewOrder`.
- The Playwright suite was touched because it depended on the old flow: `tests/mock-api.mjs` now stores and returns `paymentMethod` (and only sends `payment` for BankTransfer); `startOrder` picks the transfer option; the `buyNote` assertions became Buy-now button assertions; a new test covers a contact order (panel, no form, flips to Paid). These were type-checked and linted but NOT run.
- Verified in the browser against the local API, SePay off: only the contact option shows; Esc and a backdrop click close the dialog and focus returns to the button; a contact order for a course shows the code, both phones, Facebook and "held until" (7 days); My orders shows "Chờ Chef Lan xác nhận" / "Xem đơn"; `mark-paid` from the admin API flipped the open page to Paid within one poll and the course page then showed no Buy button and no "not owned" marks; a lesson purchase worked the same; 375 px has no horizontal scroll and the dialog and order page lay out well.
- Transfer option: with `isCheckoutEnabled` temporarily stubbed to true (reverted, not committed) both options render; choosing transfer showed the "could not create the order" error inside the dialog (the API answers 503 with SePay off). The transfer order page, the expired text for a contact order and the switch of method on an existing order were not seen in a browser.
- Local setup deviation: port 5061 cannot be used. It is on the browser fetch "bad ports" list (5060/5061, SIP), so Chrome and Node's fetch both fail with "bad port". The API was run on 5071 instead.
