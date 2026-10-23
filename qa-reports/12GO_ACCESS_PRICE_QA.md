# 12Go backend access and fare QA

Verified: 2026-10-23, approximately 09:32 UTC / 16:32 WIB. Local QA branch only; no deployment.

## Result

**PASS for one bounded actual bus search:** Kuala Lumpur → Malacca/Melaka, 6 November 2026, one adult. The independent Cloudflare backend browser returned a validated dated fare of **IDR 57,647 per adult**, matching the public desktop ticket card. The displayed card states taxes included. This is a search result, not a booked seat or a final checkout total.

Public evidence: [12Go dated route search](https://12go.asia/en/travel/kuala-lumpur/malacca?date=2026-11-06&people=1&adults=1&vehclasses_tab=all).

## Initial defects and repairs

The first remote backend probe returned zero accepted quotes in 33.5 seconds. Independent desktop inspection then established three concrete current-page incompatibilities:

1. The visible date is `Fri, Nov 6`, while the validator expected `Nov 6, 2026`.
2. Eligible ticket cards say `per adult`; the validator accepted only passenger/person/ticket wording.
3. Actual bookable departure cards no longer contain the `.trip-card-options` descendant, so the adapter discarded them all.

Updated the adapter to support the observed format while still requiring the exact full ISO date and passenger count in the final URL, matching endpoints and visible date, IDR, taxes included, an explicit per-person ticket basis and `Book now`. `From`/starting prices, `Select Time` grouped cards, vehicle/taxi totals, wrong dates/weekdays, mismatched routes and currencies remain rejected. A modern date without a year is accepted only alongside the exact full requested date in the search URL.

The second remote probe returned:

- Accepted quotes: **1**.
- Amount: **57,647 IDR**, basis `person`, scope `dated`.
- Requested/validated date: **2026-11-06**, adults **1**, displayed taxes included.
- Diagnostic: `QUOTE_ACCEPTED`; initial navigation HTTP **202**, with the rendered supplier form/ticket subsequently validated.
- Duration: approximately **33.3 seconds**.

Added fixed phase/status diagnostics without provider HTML, exception messages, cookies or session identifiers. Access-challenge detection now runs before waiting for the normal search form and stops without interacting with any verification. Also corrected the itinerary's dated-transport price-reference description so it does not show hotel check-in/room placeholders.

## Other verification

- Local and deployed public health both return HTTP200, `supplierBrowserConfigured:true`, `externalHotelBrowserConfigured:false`. Health alone does not verify a quote.
- Desktop public page showed one-adult/date context and an actual Melor Interline Express bus departure card at IDR57,647; other generic schedule/from-prices were not used.
- Regression: **271 tests pass**, none failed/skipped. Includes new current-layout, wrong-date/weekday, grouped-price, vehicle/tax rejection, and challenge-before-controls/cleanup cases.
- TypeScript/Vite build passes; existing large-bundle warning remains. Translation audit passes after the transport-specific ID/EN copy change.
- No AI request, Trip Pass quota consumption, account trip mutation, booking, payment, login, CAPTCHA solution, secret inspection or credential/configuration change.

## Limits

- Live success is for the above **one route/date/one-adult bus** query only. Rail/ferry/Vietnam/domestic Indonesia, the owner's January2027 itinerary, other dates and operational reliability are not established by this test.
- The current dated-browser adapter deliberately supports **one adult only**. Group searches still have affiliate handoff; automatic group-price reading remains unsupported, not a verified fare.
- No booking/checkout, seat hold, terminal/boarding fee, cancellation, affiliate attribution or commission payout was verified. Confirm final conditions on 12Go.
- The repair is **local and not deployed**. Production health confirms the existing binding only; production still needs an owner-authorized release of the updated parser before the same result can be claimed through the deployed Assistant.

## Evidence

`2026-10-23/evidence/12go-backend-before.json`, `12go-backend.json`, `12go-desktop.json`, `12go-desktop.png`, `12go-departure-cards.png`, `12go-regression.tap`, `12go-build.log`, `12go-i18n.json`. The departure-card screenshot shows explicit departure times, per-adult price and Book now controls; none was clicked. A provider notice says terminal fees may apply separately.

The opt-in `scripts/qa-12go.mjs --run-remote` uses a fixed read-only isolated Worker with `envFiles:[]`; it is not a production endpoint.
