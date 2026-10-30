# SortTrip — Architecture Context

## 2026-10-28 — Local Discovery companion MVP, no backend service

LocalDiscovery insideTourGuide uses lib/local-discovery.mjs staticprimary-reference venues plus existingplaceCatalog. DestinationAnchor is re-resolvedfromtrustedcatalog, optionalgetCurrentPosition is explicitone-shot8s, no watch/backend/locationstorage. GPS10kmfiltersonlycoordinate-bearingrecords; city/address-onlylists neverpromiseGPSproximity. Straightlinedistance differsfromroute; price/hour/halal unknownunlessindependentlyproven. Unsupporteddatafixture is opt-in/artificial/noMaps. AddRecommendation re-resolvesid, preservesolditems, validatesday/time, preventsduplicates and routesnewitemthroughonTripChange→nativeeditor/save; no auth/RLS bypass. Makan renderedinWorldPlanner; shoppingintent retainedinnoteusingexistingbudgetcategory. app/travel-app, WorldPlanner, RouteMap, ItemBooking andisolateddemo passcallback. Q&A deterministicreferenceonly, no newpaidendpoint. Referqa-reports/LOCAL_DISCOVERY_MVP_2026-10-28.md.

## 2026-10-28 — Local hackathon MVP demonstration, separate from staging

vite.mvp-demo.config.js/mvp-demo.html/app/mvp-demo.tsx provide loopback5175 fixture shell with envDirfalse, custompublicprefix, emptySupabasebindings, noWorker/proxy and localAPI503. Not a staging/production replacement. VideoItinerary keeps normal authenticatedMetaadapter, adds explicitlocaldemo gate, reviewed selection/order/manualconsent without fabricatedgeo and Bangkokcatalog; sharedMeta cap2000 unchanged. Native editor/search/booking components reused; demo persistence localStorage only, databaseTrips unchanged. TourGuide inItemBooking uses lib/tour-guide.mjs curated ID/EN WatArun/WatPho references, bounded deterministicQ&A, browserSpeechSynthesis lifecycle andGoogleMapslinks; no newliveAIendpoint. Existingbooking/auth/affiliate routes preserved. RealMeta/supplier/DB testing remains outside sprint authorization; reports HACKATHON_MVP_FINAL_SPRINT_2026-10-28.md.

## 2026-10-28 — Dedicated staging preparation (not deployed)

worker/staging.js is independent from production/meta-QA fetch routers. Every path validates Cloudflare Access signature/issuer/audience/time/email and fixed staging host; API additionally validates confirmed QA owner UUID/email via QA Auth. Default placeholders and disabled flags fail closed. Static assets are Worker-first; explicit routes only. Direct supplier search reuses parseQuery/searchFlights with fixed GET-only Travelpayouts egress, manual redirects, bounded body/deadline and no cache/production bridge. Meta uses normal paid RPC contract, never preview; output cap2000 matches unchanged SQL guard. app/staging-entry.tsx checks runtime/compiled QA identity, uses existing login, native editor and direct user-RLS databaseTrips for Save/list. No legacy auto-AI or transactional services. Vite isolated build emits dist-staging; public QA key only, no inherited root/process VITE Supabase variables. New server-only SQL is review material outside automatic migrations, not applied. Scope remains Phase2C-compatible preparation, no Phase3 or production activation.


## 2026-10-28 — Prompt discovery adapter (local)

app/assistant-discovery.tsx separates access→Meta plan→public quotes→Trip cards from blank-prompt FlightSearch. worker/assistant-discovery.js authenticates against configured Supabase, reads account pass and reserves through source-only reserve_paid_ai_request; existing finish_ai_request commits successful results/releases failures. No free-basic fallback. Meta core adds a fixed discovery schema and4k output cap (20k input+4k output within existing0.05USD reservation at configured rates); same token preflight/dollar ledger, no tools/retry. Country/city names and schedule validated server-side. TikTok reference helper follows only bounded exact-host public redirects/oEmbed and uses title only if supplied, never embed HTML/media. Dedicated local QA router may explicitly invoke discovery-preview without subscription tables, still auth/rate/atomic-dollar guarded; production router does not expose preview. QA subscription SQL absent per owner, not applied; no production activation.


## QA destination/search read-only path — 2026-10-28

`worker/location-search.js` shares existing airport cataloguesearch with mainandQA; boundedPOSTresolver matches suppliedrequestwords, excludingURLs/origin/simple-negations/commontravelwords. Frontenduses unique match orasksarrivalchoice, withoutmodelorvideoclaim. `worker/qa-public-flights.js` validates viaexistingparseQuery and performs only anonymousGET to fixedpublicSortTrip/api/flights; whitelistquery, noauth/cookies/prompt/envforwarding, manualredirect,18sdeadline/1MBresponsecap. This deliberatelyextendsQAforpublicsearch, notgeneralproxy, privateplanner, bookingorfinancialoperations. Actualpublicfareverified; no newpartnersecretcopied.

## Video/link transport correction — 2026-10-28

JSON media requests use a fixed bounded240KB envelope independent of activationflags; each image/text/token bound remains separatelyvalidated. Disabled frameanalysis now reports503 rather than false16KBoverflow413. `linked-transcript` accepts a validated knownsocial URL plus suppliedtext/consent and uses the existing budgetedtext extraction; server neverfollows the link and returns videoAccessedfalse. Knownvt/vm paths are accepted without broadening arbitraryURLfetch. Extractionexplicitlysets reasoning.effortlow under unchanged2koutputcap. QAerror diagnostics contain only fixedvalidationstage/usage, nevermodeltext/prompts/auth. No productionactivation or fullvideo/ASR implied.

## QA-only two-account isolation probe — 2026-10-27

MetaQARLS is rendered only in Vite meta-qa mode and validates the fixed QA Supabase URL. It uses the normal publishable client/current account plus a nonpersistent anonymous client; server credentials are never exposed to it. A127.0.0.1:5174 and B localhost:5174 isolate browser auth storage by origin. Proxy Origin rewriting accepts only exact trusted Host/Origin pairs. Probe queries filter only fixture ID, allowing server RLS to enforce ownership; no client owner filter masks failure. Sequential probes stop on unexpected access or uncertain errors and verify owner fixture integrity before/after. Scope is disposable QA rows, no ordinary saved-trip mutation.

2026-10-22 local discovery extension: worker/hotel-discovery.js bounds manual search to budget1–3star and broad city rates (two concurrent calls, optional one metadata fallback, max60 distinct results), strictly vetted through checkedLiteOffer. Nightly cap divides full-stay public total by nights and rooms. AI area catalogue sampling increases to1000 and stratified max200 candidate IDs, preserving exact-hotel refresh. Flight region is optional world/sea/domestic; UI defaultsea includesID andVN and explicit city searches retain world scope. Shared frontend ranking compares known prices/reviews/duration without fabricating unknowns. Existing free endpoint policy and payment flow remain unchanged.

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

## 2026-10-23 — Booking evidence (implemented locally)
Authenticated Worker /api/bookings/status and /flight-link verify saved-trip ownership and exact item identity. Hotel checkout summary carries trip/item context; private live hotel_checkouts supply evidence, bounded read-only refresh uses booking clientReference. Updates CAS-match trips.updated_at. React evidence context renders fresh scoped receipts; cached trip JSON cannot confer verified status. Aviasales marker782849 adds an opaque HMAC subID; Travelpayouts statistics have short private caches and require booking-only proof. Current account query400 means live flight reporting unavailable. No webhook/migration installed; no booking or payment operation is performed by evidence sync.

## 2026-10-23 — Statistics schema adaptation correction
worker/travelpayouts-bookings.js builds bounded campaign100 booking queries from public get_fields_list metadata, preferring sub_type (current actual API) over action_type (documentation variant). Missing required schema filters prevents execute_query. Returned rows are minimized and require explicit matching type/campaign/booking subtype; no subtype default. Current authenticated local execute_query200 supersedes prior400 blocker. Affiliate-reported state remains separate from issued airline tickets; no live positive conversion or deploy newly verified.


## 2026-10-24 — Local recommendation aggregates and AI stage stream
worker/recommendation-budgets.js collects fixed CGK return4-day flight series for three future months, three3-night hotel samples and production Viator references. RECOMMENDATION_BUDGETS KV holds monthly non-sensitive aggregates (up to12months), retry guards and published JSON; dedicated daily02:00UTC cron checks once per month, max3failed attempts24h apart. RECOMMENDATIONS_REFRESH_ENABLED enables collection. GET/api/recommendations reads KV or bundled actual seed only, no supplier call; numeric budgets hidden after60days. Each public card links to detail/assumptions, then fills search without automatically buying or generating. Ground fare collection remains unimplemented pending comparable dated samples.
/api/itinerary negotiates text/event-stream with fixed actual-stage callbacks and terminal embeddedHTTPstatus/JSONbody, preserves JSON clients/localisation, abort propagation and quota settlement. app/itinerary-response.mjs reads bounded UTF-8 frames and fails closed on missing result. No fabricated timed progress. Local implementation only; production remains previous release until explicitly deployed.


## 2026-10-24 — Destination duration follow-up
Recommendation cities now declare days (Hanoi5; KL/Singapore4). Collector queries the corresponding exact duration and actual hotel nights; snapshot tripDays prevents mixed-duration pooling. Published budgetVersion2 includes days/nights/journey, flightEstimate, hotelTotal and foodTotal; old published schema falls back to the verified bundled seed. CTA preserves city duration; details do not reimplement fixed3-night/four-day arithmetic. Read-only diagnostic verified prior Hanoi empty result was cached5/9-day fares filtered by4-day query, not supplier authentication. Local only.


## 2026-10-24 — Airport overnight constraints and hotel route reconciliation (local)
Shared hotel-stay-policy.mjs derives explicit last-night KLIA intent from the current message. The server requires the final overnight, splits it to KLIA/Sepang before grouping and resolves rates using a20km coordinate radius with independent hotel-geo validation. Budget/occupancy/full-stay validation remains. Client applyAIPlan rejects mismatched airport replacement coverage and reconciles mutable old-hotel transfer endpoints to the actual selected nightly stays; changed routes lose old fare/options/duration/links and require Google Maps recheck. Paid/held/manual transfers remain protected. This does not run Google Routes automatically or silently migrate saved trips.


## 2026-10-24 — Shared branding assets/tokens (local)
public/branding is canonical for self-contained outlined logos, version3favicon/ICO/PNGs, app/maskable/social assets and shared CSS tokens. Main/static HTML load tokenCSS; ReactBrandLogo/BrandIcon reference same localSVGs. app/brand-theme.css owns logo/layout/interaction styling; existing featureCSS uses semantic variables. Lightdefault and explicit .dark/data-theme variants, no theme-setting toggle. i18n updates title/description/OG/Twitter when language switches. site.webmanifest is installmetadata only, no serviceworker/offline/push added. GeneratorPython(FontTools/WindowsSegoeUI outlines) andNodeSharp produce staticoutput; Sharp is devdependency only. QA review entries stay under qa-reports, outside productionentry graph.


## 2026-10-24 — Itinerary AI lock state
Optional Item.aiLocked is a user-controlled JSON field, separate from userEdited. apply-ai-plan honors current paid/bookingHold/aiLocked state during context/merge/reconciliation; apply-price-quotes excludes protected items. ItemAILock is shared by standard/world rows. Local stale-hotel route reconciliation marks the draft dirty without silently writing account data.


## 2026-10-24 — Account menu
AccountMenu uses existing Radix DropdownMenu/Dialog primitives. Read-only account Trip Pass dialog calls /api/payments/access with scope=account; authentication and user filter remain before the scope branch. No artificial trip identity needed. Profile currently displays existing identity and fixed supported IDR currency; language uses the existing selector. Financial actions remain in the established itinerary UI.


### QA hardening — 2026-10-24
Itinerary order validation resides in worker/itinerary-order.mjs; fixed-source admission parsing in worker/official-admission.js and expiring checked references in worker/admission-reference.mjs. Exact source-backed museum coordinates are in app/verified-places.ts. Airport connection anchors follow selected flight endpoints. Route selection clears old quotes and pending/paid mutations remain guarded. Parallel route research is limited to already-known targets; unknown targets retain sequential discovery. No new credential storage, financial activation or automatic release was introduced.

## 2026-10-27 — Local Phase 2 adapter boundary
New POST /api/video-itinerary authenticates and rate-limits, streams bounded input, validates social URLs/MP4 structure or invokes a gated Meta transcript adapter. lib/video-itinerary.mjs shares deterministic candidate/schema/location/Trip logic with React. Native video is not decoded/forwarded; no permanent media storage. worker/meta-video-budget.js targets source-only Supabase service RPCs with global row-locked USD5 allocation; migration/flags unconfigured and live behavior unverified. UI creates a separate editable Trip via existing chooseTrip/planner/save, preserves existing OpenAI and payment paths. Reports: docs/hackathon-2026/phase-2/. No deployment.

## 2026-10-27 — Combined Assistant request contract
Optional attachment coexists with normal caption/preferences. Meta receives separate sourceTranscript/travelerRequest; reviewed sanitized mediaDestinations enter existing itinerary validation/research, not an alternate ungrounded planner. Trip may retain minimal assistantMedia place metadata, never raw transcript/video. Multipart upload accepts file+caption within caps but native processing stays blocked. Only explicit Explore media-plan action requests an initial normal AI run; ordinary trip/partner selections do not auto-run due to metadata. No migration/deploy or real model chain verified. See qa-reports/assistant-combined/QA_REPORT.md.

## 2026-10-27 — Phase2B processing boundary
New app/prepare-video.ts performs browser-native local MP4 decoding to three small JPEG frames. Explicit analysis sends prepared frames plus optional text/caption to existing authenticated Worker route; lib/prepared-media.mjs bounds/validates JPEG headers and timestamps. Raw Worker MP4 remains container-only422. All Meta extraction now requires explicit nonproduction flag and ledger, then fixed-endpoint input_tokens preflight <=20000 before one max2000output inference; no retry/tools. Inline images avoid remote-file storage/deletion. scripts/prepare-video-local.mjs is an offline FFmpeg QA helper, not Worker infrastructure or ASR. Five exact source snapshot identities; ambiguous aliases fail closed. No new dependencies or deployed configuration/database changes. See PHASE_2B_IMPLEMENTATION.md for local/mock versus blocked live status.

## 2026-10-27 — Dedicated local Meta QA entry/config
Use wrangler.meta-qa.jsonc and scripts/run-meta-qa.mjs for explicitly local8790 with .dev.vars.meta-qa, rather than productionWrangler/localcredentialfallback. Only meta video/status routes, fixedQAprojecthost and disabledpaidflags. Separate ViteQA config envDir qa-config/meta at5174 proxies8790 with fixedQAURL; rootproductionenv not loaded. Modern Supabase sb_secret backend binding supported through apikeyheaderonly, legacyserviceJWT remains compatible. Configuration locallytested, not started or deployed; ownerprivatekeyentrypending. No productionpayment/bookingroutes exposed in QAentry.

## 2026-10-28 — Native UI integration and offline owner profile
Existing index/main/AuthApp/TravelApp and WorldPlanner remain primary. Compact optional video input passes reviewed destinations/preferences into same Trip/editor; mergeReviewedVideoDraft preserves existing protected items and rejects destination mismatch. Tour Guide dialog contains expandable Nearby using same onChange/save flow. vite.owner-ui.config.js serves original entry at5173 with envDir disabled, empty public Supabase bindings, local catalogue only and all other API routes unavailable; no Worker/prod proxy. Test-only auth/DB mocks are injected by browser runner, not application bundle. Standalone MVP5175 remains separate reference.

## 2026-10-28 — Unified QA preparation profile and staging read routes
qa-config/original-ui.mjs feeds vite.qa-preparation5176 and staging build with original index/main/AuthApp/TravelApp; no alternate app shell. envDirfalse, no processkeyfallback, fixedQA URL/emptykey/auth-readyfalse. AuthApp adds QA owner-session verification before signed-in app, disables QA auto language metadata writes; existing databaseTrips/session/RLS remains. worker/staging retains Access/signature/host/QAowner checks, delegates explicit read allowlist to qa-read-routes. Bounded fixed Aviasales/LiteAPI metadata/rates reads require separatefalse-default QA_SUPPLIER_READS_ENABLED. All AI routes terminate503 without reserve/settle even ifflags true; payments/booking/probes404. Local5176 only staticcatalogue/identity and API503, no livebackend.

## 2026-10-28 — GateA explicit owner configuration boundary
qa-config/gate-a.mjs loads onlyfixedignored .sorttrip-qa/public-connection.local.json, neverrootenv. Schema/size/pathguards, QAclientvalidator, keyfingerprint-boundownerattestation, owneridentity/selectedredirect/resourcechecks andremoteAccessreview. Localoffline hasnoCFtokenrequirement; remoteAccessactualWorkerJWTchecksremainunchanged. original-ui.mjs injectsonlyeligibleQApublicbinding, notowner/Accessmetadata; independentallowAuthenticationfalsekeepsSDKoff inbothcurrentprofiles. PrivatefolderVitefsdeny. GateAconfigreviewdoesnotauthorizeGateB/Authwrite/provider/inference/deploy.

## 2026-10-29 — Local GateB owner-auth transport
Separatevite.qa-gate-b.config.js honorsownerchatapprovalinmemoryonly afterGateAproofs; originalUI/QAclient/tripsRLS remain. LoopbackPOSTsessionvalidateshost/origin/peerandfixedQAAuthownerconfirmedUUID/emailwithoutserverrole. SDKfetchguardrestrictsQAAuthpassword/refresh/userGET/logout andtripsGET/POST/PATCH; otherorigins/tables/RPC/accountchangesblocked. GateBlocalapprovaldoesnotenableAuthremotestaging. Noprivateconfigrewrite; noCFremoteverificationclaim.

## Gate C.2 local supplier verification — 29Oct2026

Separate vite.qa-gate-c2.config.js reuses originalQAentry/owner-sessionverification and owner-managed server-only supplier bindings. DurableC2budget5flight5rates2metadata plusglobalinflightlock preventsrestartreset/parallelburst; fixedegressallowlist/noMeta/payment. Error2001isgenuineemptyavailability; strictdefaulttaxvalidator acceptsdocumentedliteralnull, QA-onlyallowPayAtProperty requirescompleteamount/currency andreadOnlyQuote→noCheckout/details/save. NumericIDRfeescanbesummedforfullstaydisplaywithoutFX. ActualpricesUIverified; profileclosedandGateBrestored, no deployment. SeeGateC2report; credential/DB/RLS/ledgerunchanged.
