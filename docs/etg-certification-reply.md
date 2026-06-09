# ETG Certification — Reply (ticket APIR-50382)

Dear Anna,

Thank you for the detailed review. We have addressed every point below.

## 1. Test hotel search (was disabled)
Fixed. The website hotel search was returning no results because our outbound proxy
(used for the production whitelisted IP) forwarded to the **production** endpoint while we
ran with **sandbox** credentials, so requests were rejected with `incorrect_credentials`.
In sandbox mode we now call `api-sandbox.worldota.net` directly (the proxy is used only in
production).

You can now search the test hotels on https://www.natourefly.com/oteller by:
- **City name** — e.g. "Los Angeles" (returns Conrad Los Angeles 10004834,
  Downtown LA Apartments 10047711, Key View Residences 10595223), or
- **Hotel ID** — type the `hid` directly in the destination field (e.g. `10004834`).

Residency (incl. Monaco/AZ) and children ages are selectable in the search form.

## 2. Test cases (re-run with correct partner_order_id)
Corrected. We now use the ETG magic-suffix format `<finish>_<status>`:
- Scenario 1 (success): `..._success`
- Scenario 2 (unknown → ok): **`..._unknown_success`** (previously `..._unknown` — fixed)
- Scenario 3 (timeout → soldout): `..._timeout_soldout`
- Scenario 4 (unknown → book_limit): `..._unknown_book_limit`

We will re-run all four scenarios from the website and share the new Order IDs.

## 3. Room static data
Currently we display the **dynamic** room name and meal returned in the search/prebook
response; we do **not** yet ingest per-room static data (room images/amenities). When we
add room static data we will match it using **`room_name`**. If you recommend `rg_ext` for
more reliable matching, we are happy to use `rg_ext` instead.

## 4. Meal types
Mapping table completed — see section below. All 26 ETG meal types are mapped in
`lib/ratehawk.ts`.

## 5. Booking cut-off / timeout
Correct — we poll `/hotel/order/booking/finish/status/` for up to **200 seconds**
(`ETG_POLLING_MAX=40`, 40 × 5s). Please set the booking timeout to **200s** on your side so
both match.

## 6. Errors & statuses processing at `/hotel/order/booking/finish/`
At the **finish** stage we treat the following as **recoverable** (NOT a failure shown to the
user): `5xx` status code, error `timeout`, error `unknown`. For any of these we continue
polling `/finish/status/` (by `partner_order_id`) for up to 200s to obtain the real outcome.
The user sees a "booking in progress, checking status…" state, not an error.
Fatal finish errors (`booking_form_expired`, `rate_not_found`, `return_path_required`) stop
immediately and ask the user to search again.
These are kept separate from `/finish/status/` stage statuses (`soldout`, `book_limit`,
`block`, `charge`, `3ds`, …), which are terminal and stop the flow.

## 7. Order information in booking logic
Fixed. We removed `/hotel/order/info/` from the booking flow. The final booking status is
now retrieved **only** via `/finish/status/` polling. The order id is taken from the finish
response `order_ids` (or the `partner_order_id` as our own reference). `/order/info` is used
only outside the booking flow, for order-history lookups.

## 8–11. Tax data, cancellation policies, final price, room name reflection
These are now verifiable since search works. Final price uses
`payment_options → show_amount/amount` (not `daily_prices`). Ready for your review.

---

## Meal types mapping (point 4)

| ETG meal type | How Natoure displays it (AZ → EN) |
|---|---|
| all-inclusive | Hər şey daxil (All Inclusive) |
| american-breakfast | Amerika səhər yeməyi (American breakfast) |
| asian-breakfast | Asiya səhər yeməyi (Asian breakfast) |
| breakfast | Səhər yeməyi daxil (Breakfast included) |
| breakfast-buffet | Açıq büfe səhər yeməyi (Breakfast buffet) |
| breakfast-for-1 | 1 nəfərlik səhər yeməyi (Breakfast for 1) |
| breakfast-for-2 | 2 nəfərlik səhər yeməyi (Breakfast for 2) |
| chinese-breakfast | Çin səhər yeməyi (Chinese breakfast) |
| continental-breakfast | Kontinental səhər yeməyi (Continental breakfast) |
| dinner | Axşam yeməyi daxil (Dinner included) |
| english-breakfast | İngilis səhər yeməyi (English breakfast) |
| full-board | Tam pansion (3 öğün) (Full board) |
| half-board | Yarım pansion (Səhər + Axşam) (Half board) |
| half-board-dinner | Yarım pansion (Axşam yeməyi ilə) (Half board – dinner) |
| half-board-lunch | Yarım pansion (Nahar ilə) (Half board – lunch) |
| irish-breakfast | İrlandiya səhər yeməyi (Irish breakfast) |
| israeli-breakfast | İsrail səhər yeməyi (Israeli breakfast) |
| japanese-breakfast | Yapon səhər yeməyi (Japanese breakfast) |
| lunch | Nahar yeməyi daxil (Lunch included) |
| nomeal | Yemək daxil deyil (No meal) |
| scandinavian-breakfast | Skandinaviya səhər yeməyi (Scandinavian breakfast) |
| scottish-breakfast | Şotlandiya səhər yeməyi (Scottish breakfast) |
| soft-all-inclusive | Yüngül hər şey daxil (Soft All Inclusive) |
| some-meal | Bəzi yeməklər daxil (Some meal) |
| super-all-inclusive | Super hər şey daxil (Super All Inclusive) |
| ultra-all-inclusive | Ultra hər şey daxil (Ultra All Inclusive) |

Best regards,
Natoure Team
