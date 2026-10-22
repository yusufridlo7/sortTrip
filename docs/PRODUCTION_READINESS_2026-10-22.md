# Production feature inventory — 2026-10-22

Scope: current SortTrip production after Google activation (version a9c9ead2-6b59-4a6d-8ed5-6635d6729920). Read-only code review and safe public endpoint checks. No new deployment/feature activation, secret-value inspection, supplier price searches, Google requests, AI generation, payment creation, test chat messages or database migrations during this audit.

## Published but blocked / not production-ready

| Feature | Current evidence | Remaining requirement |
| --- | --- | --- |
| Native hotel price search / itinerary hotel price refresh via LiteAPI | POST /api/hotels/search with empty input returns503/errorKey lite_production_required before input validation or supplier work | Owner-controlled production key/enablement after resolving account-card terms; validate actual eligible public rates and save/reopen |
| Hotel photos, room details, reviews | GET /api/hotels/content for known public test property returns503 | LiteAPI metadata credential/feature gate not ready in production; local metadata/UI success does not establish deployed readiness |
| Native hotel Payment SDK / booking history | Unauthenticated GET /api/hotels/checkout/history returns503 before auth | Separate enable/mode/live-approval/key gates; only one owner-operated sandbox booking previously confirmed. No real customer payment/reservation, cancellation/refund or confirmation-email flow verified |
| Viator activity inventory | GET /api/activities/health200, configured=true, environment=sandbox, configurationValid=true, connectionTested=false | Resolve prior sandbox401/support inquiry and supplier-specific production requirements; no valid supplier search or mode switch performed here |
| Owner White-label | Ordinary GET owner.nuitee.link returns403 again | Nuitee resolution of Indonesia restriction; LAS-3147 latest owner evidence AWAITING CLIENT. No bypass or account change |
| Actual transport prices via12Go | Source/last real checks: affiliate widget/route links available; cloud actual dated fare retrieval unverified/unreliable, no transport inventory API approval evidenced | Obtain reliable permitted dated inventory and verify fare basis/route/availability; booking links alone do not establish exact ticket checkout |

These are not all simple disabled switches. Hotel search, metadata and checkout code are already published; supplier entitlement/financial approval and production validation are separate. LAS-3185 account-card/chargeback clarification remains unresolved in owner-provided evidence. Activation of Google does not activate LiteAPI or Viator.

## Currently active / configured, with evidence boundaries

- Google Routes: actual signed-in production WALK success just verified44min/3.0km, one attempt. This audit's unauthenticated POST returns401, confirms configuration gate passes without consuming budget. Production TRANSIT/DRIVE/fare coverage not tested. Console account-wide billing/quotas/SKU not independently verified.
- Flights: production health200/flightsConfigured=true; positive Aviasales Data API inventory historically tested. No fresh fare query, ticket purchase or affiliate commission confirmation in this audit. Indicative fares are not locked seat availability.
- AI backend: health200/aiConfigured=true. Existing generation/update/quota code published and fixture-tested; no new generation/real quota debit during this audit. Hotel/transport price limitations propagate to AI enrichment; model output must not invent missing prices.
- Login / saved trips: existing authenticated browser session and saved itineraries displayed today. No fresh sign-in or intentional customer edit/save test here. Source navigation may auto-save an unchanged dirty draft; do not use saved-view navigation as proof of zero database writes in earlier QA.
- Trip Pass: production UI shows active entitlement10results. Reading information does not establish Midtrans environment, checkout enablement or a settled real Rp30000 payment. Owner previously skipped payment QA; this audit did not consume quota, deplete entitlement to reveal checkout, create an order or perform payment.
- FAQ/Telegram support: public config200/enabled=true, code published, owner previously confirmed Telegram Reply reaches site. No new message, close/new-thread/cross-account live test here.
- Price Watch: scheduling/endpoints/UI published; Cron delivery configuration is not proof of real price-change email delivery. New notification/delivery test not performed.
- ID/EN/UI/policy pages: published and build/fixture/browser-tested across previous release checks. Real AI narrative translation reuse/cross-device preferences not retested here.

## Other non-live/optional components

- External standalone hotel-browser service: health externalHotelBrowserConfigured=false and current hotel price path excludes it. Owner previously has no separate server; LiteAPI is selected hotel architecture. Do not buy hosting or reactivate obsolete hotel browser work by default.
- Browser binding: health supplierBrowserConfigured=true means binding exists, not verified supplier fare extraction. Current hotel research uses LiteAPI;12Go is separate.
- Manual purchase checkmarks are user declarations, not supplier payment reconciliation. Confirmed native hotel booking does not yet automatically synchronize all itinerary purchase flags/budgets.
- Catalogue/local transport/default budget entries can be labelled estimates/simulations while the feature is deployed. They must not be reported as live supplier prices.
- Agoda/Booking.com-CJ/GetYourGuide/tiket.com/eSIM/insurance remain partner onboarding or concepts according to register; no production integration inferred. Klook/Trip.com tools are historical affiliate access; native Hotel now uses LiteAPI. Partner payout/commission readiness remains separately unverified.
- No commit/push has been performed for the current deployment; production is built from the tested working tree. This is release provenance, not a disabled customer feature.

## Priorities

1. Resolve LiteAPI production/card liability with owner and Nuitee, then production price/content checks before real owner-operated checkout.
2. Resolve Viator authenticated inventory access and production eligibility.
3. Establish reliable12Go actual dated prices while preserving functional affiliate search handoffs.
4. Target remaining production QA (Midtrans settlement only when owner authorizes, PriceWatch delivery, GoogleTRANSIT/DRIVE) without treating untested features as definitively disabled.

No further changes or activation authorized solely by this inventory request.

## Viator update after owner verification, 2026-10-22
Supersedes sandbox mode in the inventory above: production flag deployed, health200/configuredtrue/production, final Worker f2b46a72-b0f1-454c-a3fd-76cc1020a5e2. Production inventory remains blocked:502 VIATOR_UNAVAILABLE, failureStage=request with no upstream HTTP status. Existing key not changed or inspected; owner must privately verify Production credential. Mode production is not production-ready. Seven adapter tests pass; no booking/payment/commit/push.

## Viator latest successful production API check, 2026-10-22
Supersedes blocked status above: health200/production, live search destination77/count1 returned200/one normalized product. Worker d8e1996a-03a6-4f41-86f0-e1df5031d489, nine adapter testsPASS. Customer-facing activities UI/mapping/rate limits, exact-date inventory and affiliate tracking/booking remain unverified; no native Viator booking implemented. Credentials unchanged by agent.

2026-10-22 Viator itinerary release deployed: Worker d8b46a09-7e63-436d-bdb5-86720ff01926, keep-vars; current source/dist build successful. Native ticket search, exact-city filter, tracked link selection, optional reference budgeting and account persistence tested on owner-chosen Genting example; mobile form349px client/scroll widths at390px viewport.22focused casesPASS. Supplier exact31Jan2027 option availability, actual purchase/settlement and affiliate payout remain untested. Example usesRp84187Awana standard one-way reference from provider default23Oct2026, not generic API minimumRp72575Genting SkyWay. See latest PROJECT_PROGRESS details. No commit/push.

## Nuitée production API update — 2026-10-22
32088613-f1a6-418e-8470-4f68495cb8ad enables readonly hotel prices/content after owner private key configuration. Real datedKLsearch200/12offers. Supersedes503production-prices gate in previous inventory; nativecheckout still503, White-label still403country-blocked. Do not equate API-connected with booking/card/payout-ready.

## Hotel menu/provider split and checkout limit — 2026-10-22
StandaloneHotel menu uses tested responsiveTrip.com affiliatewidget. Nuitéeproductioncatalogue/rates remain itinerary source, alternative search keepsnativeHotelSearch. Existing nativeSDKcheckout route retained but readiness503; public SDKscript200, WhiteLabel403. No actual production payment session/country test performed; ownerLAS-3185unanswered. Release85ef3fb6-d4a1-4a06-b7cc-07ed7cc8350d;32focused fixtures/buildPASS, desktop/mobilewidget verified. No reservation/financial approval activation.
