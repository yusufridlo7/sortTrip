# SortTrip — Architecture Context

2026-10-09 Local planning update: shared RouteMap supports catalog and worldwide itineraries without dereferencing absent catalog cities; unknown coordinates remain unplotted with place/route links. Exact catalog-place matches restore approximate markers. Assistant composer spans full control grid and successful request/summary pairs persist in Trip.aiConversation (20 recent messages; independent of server quota), last6 sanitized context messages reach Worker. routeOptions legs optionally carry dated fare/duration references; no synthesized fares enter totals. Payment pass lookup is now per authenticated account; owner-applied SQL updates reserve_ai_request and set_price_watch scope without changing counters/expiry. Current DB migration remains pending. No Google transit routing/geocoding API exists yet; AI route research is distinct from live routing.


Transport performance correction2026-10-09: general research and dedicated transport research run concurrently using current routingTargets/requestedStops (not serial preliminary-research dependency), followed by one grounded draft and at most one correction. Shared provider deadline160s remains below existing180s reservation TTL; frontend185s. Research output limits3500 tokens each. Actual browser request succeeded after serial timeout diagnosis. Source membership/leg connectivity are structural checks, not independent confirmation of operator timetable/fare/service availability.

2026-10-09 Transport contract: worker/transport-plan.js provides strict route-options schema and validator; Transfer alternatives share endpoints and have connected sourced legs. Worker chooses selectedRoute from transportPreference; app persists options into trip.items and displays chosen legs directly, all alternatives/references in details. requestedStops plus routeRequests distinguish sightseeing excursions from overnight dailyCities. Currency explicitly IDR. Generated transport can be refreshed while paid/userEdited remains protected. FlightBooking uses flightAffiliateUrl validated original Aviasales search links; absent legacy link offers provider-backed fetchFlights lookup before purchase link appears. No new tracking identifier, secret or fake inventory.

2026-10-09 Local entitlement flow: POST /api/payments/access authenticates through Supabase, queries only that user's unexpired pass records, and returns safe current-pass summary plus other eligible city/date scopes. It does not invoke Midtrans or write database state. Both payments and AI use worker/trip-access.js planningKey. Saved payment actions verify optional current draft city/date matches persisted trip before reconciliation/checkout. AI reserve_ai_request remains authoritative; frontend access lookup is diagnostic and never grants access. No schema migration required for this repair.

## Verified local project stack
Current local project inspection established:
- React 19 + Vite 8 frontend.
- TypeScript/JavaScript.
- Tailwind CSS.
- Cloudflare Workers backend via Wrangler.
- Supabase for authentication/database.
- Leaflet for maps.
- Existing code references/integrations include OpenAI, Travelpayouts/Aviasales, Midtrans, and Resend.

## Local development
Viator backend preparation (2026-10-01): `worker/viator.js` serves `/api/activities` and `/api/activities/health`. Runtime-only `VIATOR_API_KEY`; `VIATOR_ENVIRONMENT` defaults to sandbox, fixed official hosts, 10-second timeout and sanitized summaries/errors. Local connection pending owner sandbox setup. No frontend activity integration or production readiness claimed. Existing Aviasales Data API remains intact.

Typical local services:
- Vite frontend: `127.0.0.1:5173`
- Cloudflare Worker: `127.0.0.1:8787`
- Vite proxies `/api` to the Worker.

A prior smoke test established:
- homepage rendered,
- Jakarta location search returned results,
- `/api/health` returned HTTP 200 through Vite,
- `/api/locations` returned HTTP 200,
- proxy health response matched the direct Worker response.

At that test, health reported:
- `aiConfigured: false`
- `flightsConfigured: false`

Treat this as a point-in-time development observation, not permanent state.

## AI architecture
Latest local2026-10-09 supersedes separate-area-draft behavior below: AIPlanner passes dailyCities/retained selections and applies validated result immediately via applyAIPlan to trip.items. Penginapan recommendations include nightly checkin/checkout and explicit unknown price; Transfer includes fromPlace/toPlace/mode. Both local/global daily planners render the same records and sources, with edits tagged userEdited. Paid/selected/manual records protected, covered templates reconciled and partial hotel nights retained. Stored aiPlan is provenance/summary only, not a separate editable list. Location suitability is researched; no geocoding or verified route-distance service introduced.
Local update2026-10-09: default gpt-6-luna (low reasoning), allowlisted environment model choices Luna/Sol only; legacy or unknown choices fall back to Luna without reading/changing the environment file. Responses API research uses web_search, then a separate strict JSON schema request restricts sourceUrl to collected HTTPS references. Both provider calls share90-second timeout; only a validated draft finalizes successful account quota. app/apply-ai-plan.ts applies visits/transfers to daily items, retains manual/paid/selected hotel records, and marks unknown prices explicitly; lodging areas remain suggestions. Provider probe passed; authenticated UI persistence/quota not yet verified.
AI should orchestrate the user journey and consume grounded data from services rather than fabricate live travel facts.

## Secret handling

### Klook hotel widget — 2026-10-09
Hotel menu renders owner-supplied public affiliate embed through a sandboxed static data-document iframe with unique opaque origin. Vendor script cannot access SortTrip origin/session. Parent accepts only fixed readiness/error and bounded height messages from its own frame; wrapper recognizes loaded only from the Klook child frame/source and official origin. No backend API, secrets or itinerary data are exchanged. Retry remounts iframe and resets timeout. Never replace the data URL with same-origin src or srcDoc under these sandbox flags.
Environment/secrets are separate from project memory.
Never copy secret values into:
- Markdown documentation,
- Git,
- Telegram,
- logs,
- task queue payloads.

## Agent interfaces under development
### Telegram
A two-way Telegram workflow has been created with commands including:
- `/status`
- `/task <instruction>` (and authorized plain messages)
- `/cancel [task-id]`
- `/resume <task-id>`
- `/help`

The bot uses an authorized-chat allowlist and persistent local queue. Telegram notifications have been tested successfully.

### Desktop browser
Codex in-app browser can perform browser workflows within the Desktop session, including reading pages, opening tabs, clicking, and filling non-sensitive fields. Manual owner authentication can be handed back to the agent afterward.

### Important limitation
Telegram currently does **not** have a verified bridge that can wake or resume the Codex Desktop browser agent for arbitrary tasks.

The autonomous local runner supports limited known workflows; general Telegram → Codex Desktop browser automation remains unresolved.

## Security model
Suggested action classes:

### AUTO
Examples:
- research/browsing,
- reading documentation,
- non-sensitive form entry,
- local code changes,
- build/test/debug,
- use of already-configured environment secrets without exposing values.

### APPROVAL_REQUIRED
Examples:
- submitting a new partnership application,
- accepting new contractual/terms commitments,
- production deployment,
- Git commit/push,
- production database changes.

### OWNER_ONLY
Examples:
- passwords,
- OTP/2FA,
- CAPTCHA,
- revealing/entering new API secrets,
- recovery codes,
- payment/bank information.

When OWNER_ONLY is reached:
`WAITING_FOR_USER` → Telegram notification → owner acts → `/resume` → agent verifies application/browser state → continue.


## Partner search-to-itinerary bridge — local2026-10-09
ItemBooking → PartnerContext → Hotel/Transport menu → isolated official partner widget → user confirms selection in PartnerSelectionForm → validated manualPartnerItem/applyPartnerSelection → current draft → existing explicit cloud save. No automatic widget-result callback. Hotel search uses owner Trip.com iframe and immutable affiliate landing URL; transport retains12Go isolated form and validated route/date link helper. Price is optional/unknown unless user supplies it; records are manual/unpaid, not verified bookings. AI generation shows live loading copy and research instructions seek public provider sources; official inventory APIs are not connected by this bridge.


### Auto-save and audited partner-link resolution —2026-10-09
AIPlanner.onResult→TravelApp.saveAIResult→persistTrip→databaseTrips authenticated Supabase/RLS→reconcileSavedTrip; local state updated before persistence, preserving results even on failure. Automatic save uses result snapshot, account ownership and existing draft generation guards; cloud failure remains dirty with retry. 12Go transportLegLink resolves audited terminals to city searches or safe source route references. Trip.com hotelAffiliateLink registry contains immutable official generated property link and general landing fallback. No dynamic desktop-browser bridge or authenticated affiliate generator API exists in Worker.


2026-10-11 Pricing extension: POST /api/itinerary accepts mode=prices and a bounded whitelist of priceTargets, authenticates/limits/reserves exactly as itinerary generation, researches approved public source domains, validates source/IDR identity/unit evidence and finalizes successful quota only when at least one eligible reference exists. Normal itinerary generation attempts the same enrichment within its single reservation. Trip JSON stores priceQuote/routePriceQuotes and priceCheckedAt; no supplier API connection or new DB migration implied. Client application protects paid items, retains flights and computes hotel room/night or partial segment subtotals.


2026-10-11 Hidden hotel browser extension (local only): priceTargets retain a sanitized public Trip.com property URL. Missing URLs may be resolved from web-search cited sources, never model-only URLs. Optional HOTEL_BROWSER binding with HOTEL_BROWSER_ENABLED=true launches an anonymous Cloudflare Playwright session; allowlisted property navigation and rendered hotel/dates/guest/night/occupancy/inclusive-IDR validation yield scope=dated,basis=stay_total. applyPriceQuotes stores the inclusive stay total once plus room/date/source/policy/time metadata and protects paid records. Price evidence does not overwrite affiliate booking links. Unsupported guest/room scope or browser failure produces no dated price. Reference transport failures retain already verified dated hotel results. wrangler.hotel-browser.jsonc is a complete reviewed alternate configuration; no Desktop browser connection or new Supabase migration required. Cloud execution/deployment not yet verified.


2026-10-11 Browser binding is deployed under owner authorization with alternate configuration. Anonymous browser launches are verified, but actual cloud Trip.com HTML does not render hotel/quote content despite HTTP200. Desktop positive search is not a cloud inventory guarantee. Fixed diagnostic codes only; unsupported/unavailable hotels remain unknown. Multi-night inclusive-total format validates explicit room/night context, and offered room capacity may exceed selected guests (rendered search guests still must match exactly).

2026-10-11 Continued existing hotel diagnosis without resetting setup or credentials. Production logs identified a main-document redirect on www.trip.com to an account/login path (fixed diagnostic HOTEL_BROWSER_REDIRECT_ACCOUNT), not a hotel quote page. Navigation is blocked by design; no account/login/CAPTCHA action was performed. Adapter now ends further hotel attempts immediately on this access gate and reports a fixed PRICE_SOURCE_ACCESS_REQUIRED message when the batch yields no prices, preserving failed-result quota and existing prices. Owner-authorized deployment version22c07d12-cf3d-422c-ab8b-26562f113562 uses wrangler.hotel-browser.jsonc --keep-vars.13 focused hotel/price tests pass. Automatic cloud dated-price insertion remains unverified and blocked by supplier access; Desktop public observations do not establish server access. No commit/push or secret changes.

2026-10-11 Hidden supplier browser revision: shared supplier-browser.js launches fresh browser/newContext per request/vendor, imports no storage state, closes context/browser. Trip.com adapter uses explicit context; new transport-browser.js uses source-cited canonical12Go public route searches, observed date/adult query, ordinary IDR control and rendered search/ticket checks. Price targets preserve mode/per-leg source identity. Browser-enabled research returns dated validated quotes only; retains accepted hotel results if transport lookup fails. Both main/alternate Wrangler configs now include binding and remote local browser flag, reducing accidental browser loss on standard local startup. Local8787/4173 health configured true and actual browser launch verified; exact quotes remain access/rendering-limited. No frontend supplier window or autonomous Desktop bridge involved.

## Localization layer — 2026-10-11
app/i18n/index.ts initializes synchronous ID/EN resources, locale formatting, exact catalogue/template label resolution and document metadata. language-switcher subscribes without remounting the app; localStorage stores language only. Supabase ordinary metadata stores language for server emails. Worker localization wrapper reads X-SortTrip-Language, retains JSON status/codes/URLs/amounts and translates known diagnostics. AI validates language into request context; structured itinerary schema remains unchanged. /api/itinerary/translate authenticates, rate-limits, requests strict text-entry output and validates numbers/URLs. NarrativeProvider applies only displayed text, with bounded account-scoped memory/sessionStorage caching and retry. No endpoint returns replacement itinerary data; translations do not reserve/finish planning quota. Implemented locally and fixture-tested, not deployed for this task.

## FAQ / support bridge — 2026-10-12
SupportCenter uses merged ID/EN support catalogue and public search/accordions. /api/support/config exposes boolean configuration only; authenticated list/detail/send verify Supabase identity and ownership. support-chat.sql creates conversations/messages/outbox/webhook-update ledger, own-read RLS and service-only atomic customer-send/admin-reply/claim/finish RPCs. New dedicated private owner bot receives protected plain-text notifications and returns replies through secret-verified webhook mapping. No imports into Telegram local runner/queue. Foreground UI polling is10 seconds; background support cron every2 minutes retries leased outbox deliveries (bounded5), existing Price Watch remains hourly. Request UUID/update ID dedupe does not eliminate Telegram acceptance/DB-ack crash duplicates. Runtime activation and SQL application remain owner-controlled; locally implemented/fixture-tested only.

2026-10-12 External hotel service architecture prepared locally: Worker -> HTTPS authenticated Node browser service -> fresh anonymous Chromium -> validated observations -> existing checkedHotelQuote -> quota/save flow. Browser windows stay off customer devices. Loopback smoke is not connected to customer frontend, requires no AI/Supabase/payment; production external service disabled until owner has hosting/settings. No browser profile import, login or challenge bypass. Actual fresh headless page opens but room prices do not render; remote-host success unverified.192 tests/build/dry-run pass. Docker packaging unbuilt.
# Optional LiteAPI hotel pipeline — 2026-10-14

worker/lite-hotel.js supplies deterministic catalogue/rate selection behind LITEAPI_ENABLED and production-key guard. AI chooses sourced Area menginap instead of named hotels; grouped overnight stays respect retained nights. API enrichment adds supplier identities/coordinates/provenance to the same saved itinerary and prices pipeline. Hotel browser/property-resolution AI calls are skipped when enabled; transport remains independent. Sandbox responses never become customer quotes. See LITEAPI_HOTEL_SETUP.md for scoped matching, public-price/tax validation and missing checkout/production verification.
# Controlled Google Routes adapter — 2026-10-14

## Native hotel checkout (local, disabled)

/api/hotels/checkout/* uses worker/hotel-checkout.js; /hotel-checkout is rendered by authenticated AuthApp with a user-keyed component. Public selection URLs carry only hotel/dates/adults; return uses distinct checkoutId UUID to prevent date/session collisions. Server owns offers/prebook/transaction identities, private RLS table plus conditional claim RPC, AES-GCM sealed payloads, explicit SDK client-secret response, stable Book clientReference and owner-scoped status/history reconciliation. Current provider validation is strict/fail-closed. No White-label or Midtrans hotel-payment dependency, no card fields or automatic confirmed-to-trip writes. No real supplier/payment/SQL verification or activation; see LITEAPI_PAYMENT_SETUP.md.

worker/google-routes.js and /api/routes/google provide optional authenticated explicit route checks with durable Supabase budget reservation before Google calls. Counters are separate from AI quota; no route content stored. Additive owner-applied google-routes-budget.sql needed; absent RPC blocks all upstream calls. Text-only UI with attribution keeps existing Leaflet map independent, no Google polylines stored/overlaid. Owner-requested free-cap defaults1000global/day,9000global/month,5user/day; daily Asia/Jakarta, monthly America/Los_Angeles to match Google free-cap reset. Current fixed request fields match documented Essentials triggers; live billed SKU and account-wide competing usage unverified. Activation and live Google/DB verification pending owner setup. See GOOGLE_MAPS_SETUP.md.

## 2026-10-22 Viator ticket architecture
worker/viator.js supports bounded read-only free-text products and exact city DESTINATIONS resolution then productFiltering.destination. Independent Cloudflare VIATOR_LIMITER10/min/IP bounds user searches. app/activity-tickets.tsx searches only on explicit submit, rejects sandbox results, displays supplier starting prices and tracked click-outs; app/activity-selection.ts guards paid/stale/unsafe selections. Item.activityOffer uses existing JSON trip persistence, no migration. Starting-price budgeting is explicit opt-in/reference; exact dated pricing, option selection and checkout remain at Viator. No AI tool or result quota is used for ticket search. Itinerary/cost selection serializes account save; map selection follows existing dirty-draft/manual Save behavior.

## 2026-10-22 Hotel navigation split
DirectSearch kindhotels/no PartnerContext renders TripHotelSearch affiliate iframe + manual record form. Hotel kind with PartnerContext (itinerary replace/day-settings) renders nativeHotelSearch. TripHotelSearch ResizeObserver fits official856x190desktop or320x320mobile widget, one iframe at a time; no unsupported affiliate query prefill. LiteAPI remains read-only production-enabled and itinerary checkout uses existing nativeSDK module; payment approval gates unchanged. Trip.com menu is separate from Nuitée itinerary backend.

2026-10-22 native checkout authenticated price basis: checkedLiteOffer defaults public SSP floor; server-only memberCheckout=true is used only after checkout auth for rooms/Prebook and yields retail total payable. Prevents SSP being mistaken for SDK charge. No other discovery callers opt in. Price, occupancy, tax and cancellation acceptance unchanged; exact selected/payable matching retained.

2026-10-22 final review: valid supplier Prebook changes now transition to ready with summary.changed/previousAmountIDR/previousRoomType/boardNames and updated cancellation details; native UI displays review notice and final consent. Payment endpoint still requires acceptFinalTerms and Book requires persisted finalTermsAccepted. Invalid totals/taxes/occupancy stay failed. No automatic supplier retries or financial fallback.
