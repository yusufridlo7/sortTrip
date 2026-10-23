# English language and localization audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Coverage and result

PARTIAL overall. Safe corrections were applied and regression/UI checks were rerun. The static audit found 1374 dictionary keys and 1018 calls, with zero coverage errors and zero unapproved literal texts. Three brand occurrences are intentional: Viator twice and SORTTRIP · HOTEL · TRIP.COM. Static coverage does not establish every runtime branch.

English and Indonesian switching, persistence, document language, titles, form labels, currency formatting, counts, policy articles and responsive layouts were checked. Details and evidence are in the test matrix; skipped financial and messaging states are not counted as passing UI tests.

## Corrections by surface

| ID | Severity | Before | Correction / cause | Affected source | Verification |
| --- | --- | --- | --- | --- | --- |
| FIX-01 | P2 | Domestic Price Watch silently filtered domestic flights | Legacy saved international scope excluded ID destinations. Saved exact route now searches scope all. | worker/price-watch.js | Domestic normalization regression passes. |
| FIX-02 | P2 | One watch completion failure abandoned later claims | Per-watch DB finish failure now logged with fixed non-sensitive code and processing continues. | worker/price-watch.js | Two-watch failed-finish isolation regression passes. |
| FIX-03 | P2 | One email network error blocked following notices | Catch each delivery independently; preserve provider idempotency key and defer only the failed notice. | worker/price-watch.js | Synthetic failure/deduplication regression passes; no real delivery. |
| FIX-04 | P2 | Unknown pages returned homepage HTTP200 | 404-page assets mode plus explicit Worker SPA entry for /hotel-checkout. | wrangler*.jsonc; worker/index.js; public/404.html | Local unknown page404, homepage/checkout200; production change not released. |
| FIX-05 | P2 | robots.txt and sitemap returned homepage HTML | Added real crawl documents; checkout/API excluded from crawl. | public/robots.txt; public/sitemap.xml | Local MIME/body semantic probes pass. |
| FIX-06 | P3 | Incorrect English singular/plural counts | Pluralized cities, stops, rooms, adults, reviews, people, days/nights. | app/i18n/locales/*.json; flight-search.tsx; hotel-search.tsx; world-planner.tsx | Singular/plural and both currency-format tests pass. |
| FIX-07 | P2 | Mixed Indonesian catalogue/category labels in English | Localized category/geography and attraction review labels; distinct Plan this trip CTA; unavailable airline neutral dash. | app/flight-search.tsx; app/travel-app.tsx; worker/index.js | Static coverage and localization regressions pass. |
| FIX-08 | P2 | About/help falsely described old coverage and browser workflow | Updated Indonesia/SEA/world coverage and actual supplier/source distinctions; removed obsolete Trip.com scraping promise. | app/i18n/locales/*.json | Both-language coverage passes; factual statements reviewed against source. |
| FIX-09 | P2 | English AI translation retained Indonesian month names | Translation prompt covers month/weekday names and narrative cache version changed to v2. | worker/narrative-translation.js; app/i18n/narratives.tsx | Real UI now 30 January–1 February 2027; numeric facts/URLs guarded by contract. |
| FIX-10 | P2 | Screen-reader labels retained Indonesian AI titles | Booking, price, information labels and map marker names use the same narrative translation as visible titles. | app/booking-status.tsx; itinerary-price.tsx; ai-item-details.tsx; route-map.tsx | Fresh-build DOM accessible labels observed in English. |
| FIX-11 | P3 | Policy pages did not consistently honor persisted language | Explicit lang query wins; otherwise stored preference, document language/title and article updated. | public/policies.js | English/Indonesian pages, persistence and back/forward checked; legal prose unchanged. |
| FIX-12 | P3 | English support notice had Indonesian footer | Admin notice footer follows ticket language; customer text preserved. | worker/support.js | Support/localization fixtures pass; no live Telegram send. |
| FIX-13 | P2 | Trip Pass configuration fallback could remain Indonesian | Localize checkout reason and send selected language on read-only access/status polling. | app/trip-pass.tsx | Build/full regression passes; unavailable-paid-account state E2E remains owner-controlled. |
| FIX-14 | P3 | Map load failure offered no recovery after stale asset build | Manual localized Reload page action added; no automatic reload loop. | app/route-map.tsx; locales | Fresh build map rendered, zoom controls used; stale build cause reproduced during QA. |
| FIX-15 | P2 | A hotel-only day suggested a zero-distance transport journey | Exclude consecutive identical coordinates; preserve real hotel-to-attraction connections. Local transport descriptions and ranking suffixes also follow language. | app/local-transport-data.ts; app/local-transport.tsx; checks/day-settings.test.mjs | New regression verifies no invented hotel-to-itself journey and retains two real connections. |

## Dates, currencies and dynamic content

English uses en-GB; Indonesian uses id-ID. The currency remains IDR: for example, IDR 300,000 in English and Rp 300.000 in Indonesian. Supplier amounts and currencies were preserved. Formatted dates use localized month names; native date inputs and some historical saved cards retain unambiguous ISO values. Device time zone and flight origin-time labels remain visible. Browser date-picker controls can follow the operating system language independently of the application.

Live translation of the existing itinerary now displays “30 January–1 February 2027” and translated route descriptions. Original user prompts, proper place names, URLs and numeric facts are preserved. The translation cache was advanced to v2 so old mixed-language month names do not persist. Failed translations offer a retry rather than fabricated English. Some historical unknown mode/location placeholders and user-written prose can still remain in their original language; this is a recorded limitation, not a complete localization pass.

## Notifications, booking and payment

The English Price Watch email fixture uses natural fare-drop copy and preserves IDR amounts, the booking URL and the one-adult scope. The Telegram support notice footer follows the ticket language; the original customer message is retained. No real email, Telegram message or financial booking confirmation was sent, so delivery language and supplier confirmation text remain unverified.

Trip Pass access/status polling now sends the selected language, and the configuration fallback is localized. Both language modes were checked on the native hotel form and checkout shell. The local unavailable-checkout response is readable English. Payment authorization, 3DS and final booking confirmations were not exercised on a real production transaction.

## Legal and provider exceptions

Cancellation, refund, payment and privacy meaning was preserved. LEGAL-01 requires owner review: the privacy policy mentions whole-trip deletion that was not found in the UI; general partner-site booking wording needs reconciliation with the embedded SDK section; the phrase “where the external service applies” is ambiguous. No substantive legal rewrite was made.

Trip.com's “0 Children” and the 12Go English form in an Indonesian shell are provider-controlled copy. Supplier reviews and room names can remain in their original language. These cross-origin widgets and original user text were not silently rewritten. Owned microcopy uses international English with “traveller”; historical “traveler/traveling” variants in legal prose are flagged for a later copy review.

## Verification

All 259 automated regressions passed. Evidence includes localization-coverage.json, ui-actions.json, ui-responsive.json and screenshots under 2026-10-23/evidence. Fresh-build accessible labels for booking, item information and prices were observed in English. The layout metric checks the top-level document; it does not certify every provider frame, all screen-reader behavior or WCAG conformance. See the matrix for exact exclusions.
