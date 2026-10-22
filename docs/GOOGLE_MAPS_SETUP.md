# Google Routes API — controlled activation

Prepared locally on2026-10-14. No live Google API request, billing activation, credential creation/change, database migration, commit/push/deploy performed. Owner has no Google setup yet and requested guidance. Existing Leaflet map remains; Google content is a separate temporary text panel with Google Maps attribution, never plotted on a non-Google map or persisted in trip JSON.

## Owner steps

1. Open https://console.cloud.google.com/ and choose/create the project for SortTrip. Owner activates billing and accepts Google terms/payment steps manually.
2. APIs & Services → Library → enable **Routes API** only initially. Maps JavaScript/Places/Route Matrix not needed for this first route panel.
3. APIs & Services → Credentials → create a dedicated server API key. Set API restrictions to Routes API. Keep it private; no frontend VITE variable, screenshot, chat, Telegram or commit. HTTP-referrer restrictions are for browser keys, not this server key. Cloudflare Worker does not provide a fixed egress IP by default, so do not invent an IP restriction; consult Google's server-key guidance for the deployed network.
4. Google Maps Platform → Quotas → Routes API: set Compute Routes daily requests to1000 where editable, requests/minute to5 where available. The application separately stops at9000attempts/month; daily quota alone cannot enforce the monthly free cap. Cloud Console quota changes require owner execution. Billing budget alerts are notifications, not spending stops. Application limits are independent of Google account-wide usage/other projects/SKUs and do not guarantee zero cost. Reduce the monthly allowance by any same-SKU usage outside this SortTrip counter before activation.
5. Review/apply [google-routes-budget.sql](../supabase/google-routes-budget.sql) in the intended Supabase project. Additive service-role-only counter table and atomic function; no itinerary/pass/payment records changed. Migration has not been executed/SQL engine tested by agent. If RPC unavailable, server fails closed before calling Google.
6. Privately set GOOGLE_MAPS_API_KEY in local .dev.vars or Cloudflare secret store. Set non-secret GOOGLE_ROUTES_ENABLED=true only after key/API/budget migration are ready. Optional non-secret bounds (defaults already apply):

```
GOOGLE_ROUTES_DAILY_LIMIT=1000
GOOGLE_ROUTES_MONTHLY_LIMIT=9000
GOOGLE_ROUTES_USER_DAILY_LIMIT=5
```

7. After setup confirmation, run one separately verified authenticated public route check; do not show the key. Deployment needs owner authorization. Production feature remains inactive until configuration/database/release complete.

## Controls and behavior

- POST /api/routes/google: signed-in account required, same-origin guard, bounded addresses/time/mode, prefixed per-minute request limiter.
- One atomic global/day/month and user/day budget reservation before one Google request. Defaults1000global/day,9000global/month,5per-account/day. Daily counters reset by Asia/Jakarta calendar; monthly counter resets at US Pacific midnight (America/Los_Angeles, including daylight saving), matching Google's free-cap month. Hard bounds on configured values; no unlimited/negative settings accepted.
- Official global pricing checked2026-10-14: Compute Routes Essentials10000free events/month, Pro5000, Enterprise1000. Current fixed request builder omits all documented Pro/Enterprise triggers (traffic-aware routing, optimized/extra waypoints, location modifiers, two-wheeler, tolls, traffic polylines, large vehicles). Client-supplied higher-tier options are not forwarded. Any future request-feature change requires a new SKU/budget review. Live billed-SKU verification remains pending.
- The free cap is shared across all projects in the same billing account. SortTrip allows9000attempts/month, leaving1000of the published10000free cap for tests/other use. This reserve is not a zero-cost guarantee if other account usage exceeds it. Backend and SQL reject allowance above9000; lower valid private environment overrides still take precedence. No Google Console settings or credentials were changed by the agent.
- Any failed route check, including exhausted budget, offers an explicit external Google Maps directions link with the selected endpoints/mode. The link opens only when clicked; it makes no SortTrip Routes API call and never automatically redirects the itinerary.
- Attempts count even on upstream failures because they may be billable. No automatic retry, Route Matrix, live traffic features, intermediate waypoints or background route sweeps.
- Explicit **Cek rute Google Maps** panel on itinerary Transportasi items with known endpoints. Customer selects mode/time and initiates search; sent planning data disclosed. No AI successful-result quota used.
- Transit supports7days past to100days future, subject to provider coverage. Transit fare only returned when Google can determine it; currency preserved, no invented IDR conversion or missing-price zero. No guarantee of cheapest route/international coverage, ticket availability or booking.
- Returns bounded route duration/distance/step/line/stop/fare facts only; no provider errors, key/header/token/opaque identifiers or polylines. No route response caching/persistence. Does not replace stored itinerary routes/paid bookings/costs.
- Public Terms of Use and Privacy Policy references are implemented at /terms.html and /privacy.html (ID/EN), linked from footer and Google route panel. They explain current processing and link Google terms/privacy; source/browser verified locally, pending release. No complete legal compliance certification is implied.
- Fixture tests verify auth/config/date gates, budget-before-request, missing/exhausted budget blocking, sanitized errors and no AI quota requests. Live SQL concurrency, Google credentials/rates and current production settings remain unverified.

Official references:
- https://developers.google.com/maps/documentation/routes/get-api-key
- https://developers.google.com/maps/documentation/routes/usage-and-billing
- https://developers.google.com/maps/documentation/routes/transit-route
- https://developers.google.com/maps/documentation/routes/policies
- https://developers.google.com/maps/billing-and-pricing/pricing
- https://developers.google.com/maps/billing-and-pricing/sku-details
- https://developers.google.com/maps/billing-and-pricing/pay-as-you-go


## Verified activation checkpoint — 2026-10-22
Historical pending-setup notes above are superseded for tested production path. Owner had already installed Cloudflare key and applied budget schema; agent verified secret-name metadata, enabled nonsecret flag with owner authorization and deployed version a9c9ead2-6b59-4a6d-8ed5-6635d6729920. Official signed-in production WALK check succeeds44min/3.0km, account4remaining. Do not repeat credential/billing/SQL setup. Only one production Google call; AIquota/itinerary unaffected. Console quotas/account-wide usage/billedSKU still need owner verification; TRANSIT/DRIVE not tested in production.
