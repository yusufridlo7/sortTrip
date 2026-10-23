# LiteAPI accommodation pipeline

## Latest local verification — 2026-10-23
Local503 was specifically a sandbox key, not a supplier country restriction. Fixed-category runtime diagnostic in hotel search revealed sandbox_key without exposing values. Owner privately replaced credential; freshly restarted Worker now returns production200. Read-only30Jan–1Feb2027/oneadult searches withIDR100000–400000perroom/night returned41Yogyakarta hotels (172checked; Cempaka~154179/night, RedDoorz near Hartono Mall3~170127/night) and1Hanoi hotel (261checked; Family Transit2~331785/night). Dated observed quotes, not held inventory or a whole-city cheapest guarantee. Standard runtime moved back to8787 for Vite/preview proxy. No credential read/change by agent, supplier Prebook/Book/payment, margin override, or deployment. Public discovery keeps SSP floor and inclusive-tax checks.
Native hotel UI/API now accepts optional minNightly/maxNightly in IDR per room per night; empty/0endpoints are open, finite maximum must be>=minimum. Removed fixedRp300000preset; inclusive filtering divides full-stay quote by nights×rooms. Actual live verification supersedes local production-config blocker, not separate White-label403 or financial liability issues. Historical sections below are dated history, not current readiness.

Implemented locally, not deployed or enabled for customers. Current owner key was verified as sandbox. Owner alone configures credentials/billing; never paste keys into chat.

## Runtime activation

Supply a valid production `LITEAPI_API_KEY` privately and set non-secret `LITEAPI_ENABLED=true` in the intended Worker environment. Enabling the flag with a sandbox key returns a fixed error before quota reservation. Supplier responses carrying sandbox=true are rejected. An absent/false flag leaves hotel areas unpriced and the hotel menu unavailable; no active Trip.com fallback. No secret or flag has been changed by the agent.

## Division of work

- With production API configuration, AI researches attractions, routes and a sourced neighborhood. It does not search hotel property pages or prices.
- Consecutive nights in one neighborhood are grouped; retained/paid/manual hotels interrupt the group. No model-generated hotel ID, coordinates or fare is accepted.
- Backend queries the city hotel catalogue, matches the exact neighborhood text in supplier names/addresses, then searches rates for that subset and the full stay. Catalogue requests are reused within the same operation; at most6stay groups,200catalogue entries/city,40matched properties/group,4offers/property. An unknown country/area or no match leaves the recommendation unpriced. No silent citywide fallback. Supported named country aliases are in worker/lite-hotel.js; ISO2 codes accepted.
- One/two adults per room, up to8adults/4rooms, no children, Indonesian nationality, IDR. Exact dates and occupancy; max31nights/stay. These explicit constraints are not a claim of full worldwide/guest support.
- Compare standard public rates only, with explicit included-tax breakdown, room occupancy and cancellation tag. Exclude package rates and charges not included. Do not publish below returned suggestedSellingPrice; use the greater of retail and required public display price. No claim of globally cheapest rate, review/accessibility match, computed transit costs or unrestricted supplier public-rate rights. Partner rules must be reviewed before launch.
- Selected named hotel, supplier ID, observed coordinates, full-stay amount and source metadata enter the same itinerary/save pipeline. Full-stay totals are not multiplied by nights again. Updates reuse that exact supplier hotel ID/name; they do not replace a selected hotel with a cheaper different one. Paid items remain unchanged.
- Price refresh uses API calls for hotels, no hotel browser or hotel web-search call. Transport is still the existing12Go workflow. A successful batch uses the existing single-result quota; unavailable price-only requests release reservation without debit.

## Checkout boundary

Owner subsequently selected native Payment SDK checkout. Hotel/itinerary buttons now open /hotel-checkout with supplier hotel/dates/adults; no active White-label/Trip.com checkout dependency. New optional backend supports authenticated room selection, encrypted private checkout storage, Prebook, explicit final-term/payment consent, SDK portal and Book/reconciliation. It is disabled by default, not deployed and has no real payment/booking verification. Price research remains read-only; only explicit checkout actions can start Prebook/Book. Owner applies separate liteapi-checkout.sql and operates sandbox payment test first. See LITEAPI_PAYMENT_SETUP.md. Historical White-label URL builder remains for metadata, not active booking actions. No exact rate, checkout, refund or commission guarantee.

Owner update2026-10-14: supplied https://yusuf-ridlo-kkxjf.nuitee.link. Added this public root to both local Wrangler deployment configurations as LITEAPI_WHITELABEL_URL. Official Desktop browser verification encountered403CloudFront country restriction in the testing browser. Do not infer account rejection/site-wide failure or bypass geography. Owner-device/customer-country access, dated hotel detail matching, room selection/checkout and commission remain unverified; production hotel key still required. No deployment or private environment file change by agent.

## Hotel menu

POST /api/hotels/search uses the same production-only validator, without AI/account result-quota consumption. Public searches have same-origin/size/date/occupancy guards and a separate prefixed request-rate limit. The native ID/EN responsive form searches city/country and optional area, displays up to12lowest checked eligible properties from a bounded catalogue, and uses existing explicit trip-selection/save callback. Full-stay totals and dates/guests preserved; no sandbox customer results. Day settings now open this search rather than the simulated legacy hotel comparison UI. Historical supplier metadata/helpers remain for old saved records/regressions, not new click-out actions.

## Verification

- Seven focused supplier fixtures verify area boundaries, cheapest checked comparable rate, taxes/occupancy, sandbox rejection, grouping, retained-night protection and authenticated refresh without AI/browser work.
- Frontend regression verifies full-stay/group amount persistence and paid/mismatched hotel protection.
- Real sandbox smoke `node --env-file=.dev.vars scripts/liteapi-hotel-check.mjs --workflow` validates structured public totals without applying them to customer trips. On2026-10-14 returned5rates,2accepted standard public test offers; package rates excluded. This is not production inventory evidence.
- `node --env-file=.dev.vars scripts/liteapi-check.mjs` tests reference authentication only.
- No automated production activation, payment, quota reset, deployment or credential mutation.

## Production readonly activation — 2026-10-22
Supersedes historical local-only/missing-key/disabled notes: LITEAPI_ENABLED=true deployed32088613-f1a6-418e-8470-4f68495cb8ad after owner private production key setup. Real KL30Jan–1Feb2027/oneadult catalogue+rates200/12eligibleIDRoffers verified. Free-endpoint allowlist remains enforced. NativeSDK checkout503gated; no prebook/booking/payment performed. Owner reconfirmed publicWhite-label URL, but ordinaryGET still403CloudFrontcountry restriction; no functioning White-label checkout claim. API price access is independent of White-label availability and financial terms.
