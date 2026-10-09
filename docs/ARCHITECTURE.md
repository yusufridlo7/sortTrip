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
