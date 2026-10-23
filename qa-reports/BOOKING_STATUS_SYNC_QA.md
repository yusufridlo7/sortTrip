# Booking purchase-status sync QA â€” 2026-10-23

## Scope and result
Implemented locally on `codex/qa-production-readiness-2026-10-23`. Owner supplied public Travelpayouts marker **782849**. No credential values read or changed; no SQL migration, commit, push or deployment.

Three separate levels now appear in Indonesian and English:
- Traveller-marked: a manual record, not partner verification.
- Partner-reported purchase: a matching affiliate booking report, not proof of airline ticket issuance or a PNR. It does not automatically mark the flight paid.
- Confirmed reservation: an exact matching private live NuitÃ©e checkout record with a booking reference. This may mark the corresponding saved hotel item paid.

## Changes
- New authenticated `/api/bookings/status` and `/api/bookings/flight-link` handlers check owner, saved trip, selected item and current identity. Same-origin checks, bounded requests, rate limits and private caches apply.
- Hotel checkout URLs retain saved trip/item context. Matching includes hotel, dates and occupancy; unrelated/historical checkouts cannot attach themselves to an itinerary.
- Read-only hotel refresh uses existing booking lookup, never Prebook, payment or Book. Pending/unknown records hold the hotel against replacement and offer the existing checkout recovery link. Cancellation does not imply a refund.
- Server updates use `updated_at` optimistic concurrency. Cached/client-authored provenance alone never grants a verified badge; changed selection/trip invalidates old evidence.
- Flight links keep public affiliate marker 782849 and add an opaque user/trip/selection-scoped HMAC subID. Preparing the link does not navigate, purchase or confirm payment. Direct-link/manual fallback remains available on failure.
- Statistics require exact matching subID and a booking-only discriminator supported by the live schema (`sub_type` in the current API). Paid clicks, ambiguous multiple orders and unsupported responses do not become purchase evidence.

## Actual browser/API observations
- Local authenticated saved Kuala Lumpur trip: hotel private-record lookup available; no matching newly linked confirmed purchase was demonstrated. This is not a real booking test.
- Travelpayouts field metadata returned **200**. Current relevant fields include action_id, campaign_id, date, state, sub_id, **sub_type**, type and updated_at; action_type is absent.
- Root cause reproduced and resolved: the original adapter unconditionally sent `action_type=booking`, based on a documentation example, although live field metadata does not support action_type. Safe diagnostics identified **400 / ACTION_TYPE_REJECTED**. The live schema exposes **sub_type** with equality filtering. Corrected metadata-driven query uses `type=action`, `campaign_id=100`, **`sub_type=booking`**, exact dot-prefixed scoped subID and a30-day date bound. Actual authenticated UI now reports statistics **HTTP200 / available**, with the truthful message that no matching purchase has been reported. This was an adapter field mismatch, not an established account-access or credential problem. No new token, permission change or partner support approval was needed.
- Removed the implicit booking subtype default. Rows must explicitly contain the selected booking discriminator, type=action and campaign100; paid clicks/advertising/generic activity/missing discriminators are rejected. An unsupported schema prevents the request rather than sending an invalid fallback filter. Incomplete result sets cannot produce a positive receipt.
- Prepared flight link in the actual UI points to www.aviasales.com and has marker root782849 plus the scoped stf_ subID. The link was not followed and no ticket was bought.
- ID/EN language switch renders appropriate copy; 390px viewport had document width375px (no horizontal overflow). Existing nine AI results and itinerary purchase marks were not consumed/changed by this test.

## Verification
- Full fixture regression: 285 passing, zero failures/skips after the additional real-schema rejection regression.
- TypeScript/Vite production build: pass.
- Translation audit:1415 keys /1037 static calls, no missing keys, interpolation mismatch or untranslated JSX copy.
- Tests cover authentication/ownership/origin, stale selection, exact hotel context, optimistic concurrency, opaque marker scope, paid-click rejection, ambiguous affiliate orders, cached JSON isolation, pending holds, cancellation/refund distinction, and all three rendered ID/EN status levels using labelled synthetic receipts.
- Positive supplier-confirmed/affiliate-reported UI states are fixture-tested; no real financial transaction or live affiliate conversion was asserted.

Evidence: `2026-10-23/evidence/booking-status-regression.tap`, `booking-status-build.log`, `booking-status-i18n.json`, `booking-status-mobile-id.png`, `booking-status-mobile-en.png`.

## Remaining limitations
Owner-authorized release:commit770afbd deployed version7f7ea8c2-225e-4a72-9bcf-ce8f7ee076a1. Actual authenticated production metadata/query200 verified with zero scoped matches. Previously completed checkouts without saved trip/item linkage and old affiliate links cannot be retroactively identified reliably. Live statistics endpoint/read-only zero-match path is now verified, but a positive real conversion remains untested. Statistics look back30days, max two eligible flight items, cache60seconds. Multiple distinct orders are ambiguous. HMAC correlation changes if the existing API token is rotated. Refresh/focus polling is implemented; no supplier webhook has been registered. End-to-end live booking, payment liability (LAS-3185), refunds, commission settlement and airline ticket issuance remain outside this verification.

## Primary references
- [Travelpayouts booking statistics](https://support.travelpayouts.com/hc/en-us/articles/360019864079-API-of-affiliate-programs-booking-statistics)
- [Travelpayouts marker and SubID](https://support.travelpayouts.com/hc/en-us/articles/203955653-ID-and-SubID-Affiliate-marker-and-additional-marker)
- [NuitÃ©e booking lookup](https://docs.liteapi.travel/reference/listbookings)

## HTTP400 repair follow-up — 2026-10-23
Files: worker/travelpayouts-bookings.js (schema-driven query/strict response normalization), worker/booking-evidence.js (integration and safe metadata diagnostics), app/booking-evidence.tsx (safe schema attributes), checks/travelpayouts-bookings.test.mjs and checks/booking-evidence.test.mjs (real metadata regression and unsupported-schema protections). Current official documentation examples call the discriminator action_type, while the actual campaign100 API advertises sub_type; runtime metadata is now authoritative for this choice. Known supported action_type remains a compatibility option only when explicitly advertised.

Additional evidence: booking-status-api-fixed.json, booking-status-api-fixed-id.png, booking-status-api-fixed-en.png. No real ticket/booking/payment, saved itinerary mutation, credential read/change, AIquota use, commit/push/deploy.

## Production release checkpoint
Owner-authorized commit770afbd pushed and deployed version7f7ea8c2-225e-4a72-9bcf-ce8f7ee076a1. Official production browser now independently verifies metadata200/execute_query200, hotel lookup available and no matching affiliate purchase. No real booking/payment/ownertrip save/AIquota use. See RELEASE_2026-10-23.md.
