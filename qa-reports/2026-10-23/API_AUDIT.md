# API and configuration audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

| ID | Layer | Status | HTTP | Meaning |
| --- | --- | --- | --- | --- |
| PROD-HEALTH | production | PASS | 200 | Expected response/status only |
| PROD-UNKNOWN-API | production | PASS | 404 | Expected response/status only |
| PROD-METHOD | production | PASS | 405 | Expected response/status only |
| PROD-AUTOCOMPLETE | production | PASS | 200 | Expected response/status only |
| PROD-FLIGHT-INVALID | production | PASS | 400 | Expected response/status only |
| PROD-HOTEL-ORIGIN | production | PASS | 403 | hotel_origin_rejected |
| PROD-HOTEL-INVALID | production | PASS | 400 | hotel_invalid_search |
| PROD-HOTEL-PRIVATE | production | PASS | 401 | Expected response/status only |
| PROD-PAYMENT-PRIVATE | production | PASS | 401 | Expected response/status only |
| PROD-PAYMENT-ORIGIN | production | PASS | 403 | Expected response/status only |
| PROD-PAYMENT-BAD-WEBHOOK | production | PASS | 403 | Expected response/status only |
| PROD-SUPPORT-CONFIG | production | PASS | 200 | Expected response/status only |
| PROD-SUPPORT-BAD-WEBHOOK | production | PASS | 403 | SUPPORT_FORBIDDEN |
| PROD-GOOGLE-PRIVATE | production | PASS | 401 | Expected response/status only |
| PROD-ITINERARY-PRIVATE | production | PASS | 401 | Expected response/status only |
| PROD-VIATOR-HEALTH | production | PASS | 200 | Expected response/status only |
| PROD-PAGE-/ | production | PASS | 200 | Expected response/status only |
| PROD-PAGE-/hotel-checkout | production | PASS | 200 | Expected response/status only |
| PROD-PAGE-/terms | production | PASS | 200 | Expected response/status only |
| PROD-PAGE-/privacy | production | PASS | 200 | Expected response/status only |
| PROD-MISSING-PAGE | production | FAIL | 200 | Expected response/status only |
| PROD-ROBOTS | production | FAIL | 200 | Expected response/status only |
| PROD-SITEMAP | production | FAIL | 200 | Expected response/status only |
| LOCAL-HEALTH | local | PASS | 200 | Expected response/status only |
| LOCAL-UNKNOWN-API | local | PASS | 404 | Expected response/status only |
| LOCAL-METHOD | local | PASS | 405 | Expected response/status only |
| LOCAL-AUTOCOMPLETE | local | PASS | 200 | Expected response/status only |
| LOCAL-FLIGHT-INVALID | local | PASS | 400 | Expected response/status only |
| LOCAL-HOTEL-ORIGIN | local | PASS | 403 | hotel_origin_rejected |
| LOCAL-HOTEL-INVALID | local | PASS | 400 | hotel_invalid_search |
| LOCAL-HOTEL-PRIVATE | local | BLOCKED | 503 | Expected response/status only |
| LOCAL-PAYMENT-PRIVATE | local | PASS | 401 | Expected response/status only |
| LOCAL-PAYMENT-ORIGIN | local | PASS | 403 | Expected response/status only |
| LOCAL-PAYMENT-BAD-WEBHOOK | local | PASS | 403 | Expected response/status only |
| LOCAL-SUPPORT-CONFIG | local | PASS | 200 | Expected response/status only |
| LOCAL-SUPPORT-BAD-WEBHOOK | local | PASS | 403 | SUPPORT_FORBIDDEN |
| LOCAL-GOOGLE-PRIVATE | local | PASS | 401 | Expected response/status only |
| LOCAL-ITINERARY-PRIVATE | local | PASS | 401 | Expected response/status only |
| LOCAL-VIATOR-HEALTH | local | PASS | 200 | Expected response/status only |
| LOCAL-PAGE-/ | local | PASS | 200 | Expected response/status only |
| LOCAL-PAGE-/hotel-checkout | local | PASS | 200 | Expected response/status only |
| LOCAL-PAGE-/terms | local | PASS | 200 | Expected response/status only |
| LOCAL-PAGE-/privacy | local | PASS | 200 | Expected response/status only |
| LOCAL-MISSING-PAGE | local | PASS | 404 | Expected response/status only |
| LOCAL-ROBOTS | local | PASS | 200 | Expected response/status only |
| LOCAL-SITEMAP | local | PASS | 200 | Expected response/status only |
| LIVE-FLIGHT-CGK-KUL | supplier read-only | PASS | 200 | cached indicative fares; empty results do not prove sold-out flights; no checkout |
| LIVE-FLIGHT-CGK-SIN | supplier read-only | PASS | 200 | cached indicative fares; empty results do not prove sold-out flights; no checkout |
| LIVE-FLIGHT-CGK-BKK | supplier read-only | PASS | 200 | cached indicative fares; empty results do not prove sold-out flights; no checkout |
| LIVE-FLIGHT-CGK-NRT | supplier read-only | PASS | 200 | cached indicative fares; empty results do not prove sold-out flights; no checkout |
| LIVE-FLIGHT-SUB-SIN | supplier read-only | PASS | 200 | cached indicative fares; empty results do not prove sold-out flights; no checkout |
| LIVE-VIATOR | supplier read-only | PASS | 200 | starting price, not date/option availability |
| LIVE-NUITEE-SEARCH | supplier read-only | PASS | 200 | public supplier quote, not held inventory or a booking; account-specific commercial terms not verified |
| LIVE-NUITEE-CONTENT | supplier read-only | PASS | 200 | Expected response/status only |
| LIVE-VIATOR-PRODUCTION | supplier read-only | PASS | 200 | starting prices are not exact-date availability |

## Request and configuration boundaries

Invalid/origin/unauthenticated rejection probes did not create transactions. Nonces, tokens, session identifiers and secret values were not recorded. Real searches were bounded, not bulk load. Local Viator reports sandbox and returns no products; production catalogue200 returns one product. Local Nuitée rates/content production200 but checkout503; public production checkout history401 demonstrates readiness/auth gate only. /api/health configured=true is not a real provider test. Live pricing remains date/supplier-specific. See the matrix for exact scope; provider error/retry/auth/cost controls have synthetic contracts.
