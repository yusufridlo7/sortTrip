# Transport and activities audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## 12Go

Official isolated iframe rendered origin,destination,date and Find Tickets, affiliate id in widget/fallback link. Top-level seven-width layouts passed. No native bus/train/ferry inventory API implemented: links/widget hand off search/booking. Affiliate contracts validate origin/destination/date/passenger contexts and HTTPS host safeguards. No actual seat/date fare, external checkout or commission conversion verified. Provider form remains English in Indonesian shell, an explicit vendor-language exception.

## Google Routes and OSM

Fresh signed-in local WALK Travelodge Kuala Lumpur City Centre→KLCC Park returned44 minutes / 3.0 km with English navigation, fare unavailable correctly distinguished from free, four personal checks remaining. One bounded request; AIquota stayed10. Modes/transit/drive/error handling tested by contracts; current live TRANSIT/DRIVE not repeated. App caps default 1000/day, 9000/month and 5/account/day with atomic DB counter before upstream. Other billing-project use and Google Console quotas are owner checks; no unconditional no-charge assurance.

Leaflet/OSM rendered markers/stop-order lines and zoom controls. Stop-order lines are not road navigation; attribution kept. Missing-coordinate message and map-reload fallback visible. Google content stays separately attributed/temporary; no mixing Google polylines into OSM source.

## Viator / Klook

Actual production catalogue search200/one product startingIDR832702.89; existing Genting activity retains affiliate link and from-price disclaimer. Local Viator remains sandbox/empty; configuration drift recorded. Contract tests cover source/link/price/saved-selection invalidation. Exact dated option availability and attribution settlement NOT_TESTED. Klook legacy source is not active Hotel menu; no current API readiness claim.
