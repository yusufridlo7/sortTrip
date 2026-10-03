# SortTrip — Post-QA changes

Verified 2026-10-03 (Asia/Jakarta). Continuation of completed QA; no commit, push, deployment, credential change, or real payment.

## Results

1. Midtrans integration retained. Authenticated production UI shows enabled **Coba pembayaran** and **Mode uji**: sandbox only, not proof of live payment settlement. Local direct/proxied payment status returns HTTP 503 before Midtrans because the Worker requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Production unauthenticated probe returns 401, then logged-in UI confirms sandbox eligibility. No checkout was opened or paid.
2. Trip Pass now refreshes verified server status on opening a saved trip and returning/focusing the page (throttled); manual retry remains. Active pass hides purchase/Basic marketing and shows compact status plus an accessible ! detail control. Expiry, remaining allowance and Price Watch appear on demand. Frontend validates the Midtrans redirect host. Server reports safe purchase-unavailable reasons without values. Active paid UI and real settlement remain unverified locally until owner configuration; no entitlement was fabricated for testing.
3. Flight CTA now reads **Beli tiket** in search, standard itinerary and worldwide itinerary. Existing Travelpayouts API and provider links are preserved. Data API connectivity is not evidence of commission attribution.
4. 12Go route and fallback links share the existing public affiliate configuration. Browser DOM confirms route/date/adult count and affiliate parameter on the outgoing link. Commission/account attribution is not tested by creating a booking or inspecting cookies. Owner says hotel partners are not available: skip hotel onboarding/integration. Unaffiliated provider purchase CTAs are replaced by an unavailable notice; maps remain research links.
5. City, hotel, route and add-activity entry points are grouped under each day's **Pengaturan hari**. Their editors initialize to that day. Worldwide manual entry is also day-scoped. Browser testing found the old portalled city combobox did not retain the clicked choice inside the dialog; replaced with a searchable native choice that successfully selects Melaka.
6. Changing overnight city automatically chooses a catalog stay or an explicitly labelled search area near preceding/following sightseeing coordinates in that city. Prices/coordinates remain estimates, not live rooms. Paid bookings are protected; unchanged nights retain their hotel choice; selecting the same city is now a no-op. Return-night split check-in defaults to 15:00 instead of copying an earlier night's arrival time.

## Verification

- npm.cmd run build: PASS. Non-blocking main bundle warning (~695 kB).
- node --test checks/*.test.mjs: 84 PASS (including 8 added tests for recommendations, paid protection/no-op, checkout request/pending reuse/status, affiliate fallback).
- git diff --check: no whitespace errors; existing Windows line-ending warnings only.
- Official In-app Browser: local existing QA Kuala Lumpur trip day 2 changed to Melaka, hotel/search area auto-created, transfer links include affiliate ID, save and reload preserve Melaka and total Rp4,297,193. Day-2 hotel/routing dialogs correctly scope to Melaka/day 2. Owner's Singapore trip untouched.
- Midtrans network calls in automated checkout tests use injected fixtures only; these are tests, not real provider success.
- New UI screenshot captured at actual viewport width 935. Requested 390-wide override did not take effect on this tab; do not claim a fresh mobile pass. Override reset. Earlier full QA responsive results remain historical.

## Owner action / remaining limits

- Owner supplies/verifies missing Worker-side Supabase payment configuration in ignored local .dev.vars without sharing values; SUPABASE_SERVICE_ROLE_KEY must remain Worker-only, never VITE-prefixed. Restart Worker, then verify local payment status. Existing Midtrans settings may also need owner verification once this first configuration gate passes. Do not copy production credentials via browser/storage or change payment mode automatically.
- Any actual Midtrans checkout/payment, production activation and credential configuration remain owner-only. Production currently exposes sandbox, not confirmed real-money mode.
- Verify Aviasales affiliate attribution using official partner reporting later; do not replace its working API token. Hotel affiliate work is deferred by owner.
- Live hotel inventory is not implemented. Automatic lodging is a catalog/search-area suggestion limited to supported cities. Worldwide destinations remain manual.
- Fresh mobile check and live active-pass/settlement check remain pending. No deploy authorized.

## Files changed in this continuation

app/ai-planner.tsx, app/cities.ts, app/city-planner.tsx, app/day-trip.tsx, app/direct-search.tsx, app/flight-search.tsx, app/globals.css, app/hotel-planner.tsx, app/item-booking.tsx, app/provider-compare.tsx, app/return-flight.tsx, app/transport-affiliate.mjs, app/transport-affiliate.d.mts, app/transport-booking.tsx, app/travel-app.tsx, app/trip-pass.tsx, app/world-planner.tsx, worker/payments.js, checks/day-settings.test.mjs, checks/payments.test.mjs, checks/transport-affiliate.test.mjs; project-memory/report files. Other pre-existing QA and owner changes were retained.


### Local payment configuration follow-up — 2026-10-03
Owner saved local configuration; Worker restarted without reading environment values. Direct/proxy unauthenticated status now401 instead of503. Authenticated local UI loads payment status and reports Konfigurasi Midtrans server belum tersedia (sandbox). Supabase payment-status access now verified; local MIDTRANS_SERVER_KEY remains unavailable. No checkout/payment attempted. .dev.vars confirmed Git-ignored. Owner supplies sandbox key privately and verifies sandbox owner eligibility; no production change.


### Midtrans local owner gate — 2026-10-03
After the next owner configuration save and Worker restart, authenticated local status now reports Pembayaran sandbox hanya tersedia untuk akun pemilik; sandbox checkout disabled. This establishes MIDTRANS_SERVER_KEY presence under the current handler, not validity against Midtrans. Remaining gate: OWNER_TEST_ENABLED must equal true and OWNER_USER_ID must match authenticated Supabase user ID. No credential values inspected; no checkout or provider payment call.


### Local sandbox owner configuration verified — 2026-10-03
After owner save and Worker restart, authenticated local Trip Pass UI shows Midtrans sandbox pembayaran uji khusus pemilik; Coba pembayaran Midtrans enabled and owner-test action visible. Supabase status access, Midtrans key presence and owner eligibility gates now pass. No checkout initiated: actual Midtrans key validity, Snap redirect and settlement remain unverified. Owner takes over sandbox checkout; never use real payment. No secrets read or configuration modified by agent.


### Checkout interaction repair — 2026-10-03
Owner reported checkout not opening. Observed status-refresh rate-limit message in local UI. Fixed focus refresh disabling an already-authorized checkout, automatic refresh clearing previous checkout errors, and status endpoint returning429 when only provider reconciliation is throttled. Status now returns stored state with refreshDeferred while preserving upstream rate limits and no automatic entitlement grant. Added validated manual checkout link fallback and safe fixed backend error categories with upstream HTTP status only. Build PASS;13 payment tests PASS including rejected-provider sanitization and rate-limit deferral. No actual checkout initiated by agent; owner checkout result remains required.


### Existing checkout recovery verified — 2026-10-03
Continued same incident without restarting QA. Real authenticated status initially surfaced PAYMENT_MISMATCH; handling Midtrans HTTP200/body status_code404 as CHECKOUT_NOT_STARTED revealed that the existing order already has a checkout URL. Official docs explain Snap may have no Core API status before a payment method is chosen (https://docs.midtrans.com/docs/transaction-status-cycle). Restored only the owned order URL, validating HTTPS and exact environment-specific Midtrans host; UI now shows Buka halaman pembayaran and hides duplicate purchase/owner-test actions. Confirmed recovery link visible using DOM text only; its value was not read or logged. No new order, checkout navigation, payment, or entitlement grant by agent. Separate status/check-out loading labels; safe diagnostics preserve no raw provider data. Build PASS;15 payment tests PASS, including200/body404, HTTP404, unsafe URL rejection and no writes/entitlement on not-started status. Owner must click recovered sandbox link and complete simulation, then status/active-pass UI can be verified.


### Single fixed-label purchase control — 2026-10-03
Matched owner screenshot intent: one Beli Trip Pass · Rp15.000 control with fixed label for new/resumed checkout. Removed owner-test UI button and moved manual status check under ! details. Existing owner-test backend remains owner-gated, not invoked. Official browser verifies one purchase link, zero duplicate purchase buttons, zero owner-test buttons, zero status buttons while details closed; details opens/closes and reveals status correctly. Existing checkout restored without reading link value or creating a new order. Build PASS and15 payment tests PASS. Real checkout navigation/payment remains owner-only/unverified. Two old local tabs were unresponsive to browser tools; fresh local tab used for verification.
