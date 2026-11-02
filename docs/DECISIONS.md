# SortTrip — Decision Log

## 2026-10-23 — Compact itinerary reading

Owner requested collapsed conversation and per-item detail by default. Use native keyboard-accessible disclosures, independent for each item; keep children mounted so form choices persist during hide/show. Expansion is presentation state, never an itinerary mutation or API trigger. Keep title/time/price/Edit visible and Assistant operation/error/cancel controls outside the hidden conversation. Apply consistently in daily catalogue/world itineraries and map stop lists. No persistence of expansion across trip switches or reload was requested.

## 2026-10-23 — QA release scope correction

Owner explicitly confirmed Nuitée White-label is no longer used. Country403/LAS-3147 is archival and must not block the active product: standalone Hotel menu uses Trip.com affiliate widget; itinerary hotels use Nuitée API+Payment SDK. Actual payment/Book/refund and payout remain unverified; LAS-3185 is a separate account-card liability question.

Master QA separates source/fixtures, real read-only API, browser, production and owner-controlled tests. Mock/source success cannot certify deployed RLS, financial transactions or scheduled alert receipt. No automatic release or financial configuration change under this QA request. Reports in `qa-reports/` dated2026-10-23 are the current evidence snapshot.

2026-10-23 Owner replacesRp300000quickcap with optional minimum–maximum budget range perroom/night. Empty bounds remain open; reject inverted bounds rather than silently changing them. Apply range to vetted public full-stay total divided by nights×rooms. Retain class/brand/review sorting and source coverage limits. Local production validation must use owner-installed production credential; never bypass sandbox protection or extract Cloudflare secrets.

2026-10-22 Owner prioritizes beginner budget/value discovery in domestic Indonesia and Southeast Asia including Vietnam. Preserve worldwide optional discovery, Trip.com standalone Hotel menu and Nuitée itinerary booking. Manual native hotel search uses bounded budget-star plus broad city rate passes instead of first40 catalogue ordering; name/brand and per-room/night cap optional. Keep supplier public SSP, taxes/occupancy/cancellation checks and account5% markup inheritance unchanged. AI chooses areas and sourced transport tradeoffs; deterministic supplier lookup supplies inventory/prices. Never guarantee Rp300000 stock or whole-city cheapest from bounded results. Current implementation local; production inventory and browser QA remain separately recorded. No automatic booking, credential change or deployment authorized by this product clarification.

2026-10-09 Owner product change supersedes city/date-scoped Trip Pass: one 30-day Rp15.000 pass supports new and existing trips within the same account;20 successful Assistant results shared across trips. Existing consumption and expiry remain intact. Failed requests do not count; only normal successful settlement increments. Keep payment orders attached to their owned originating trip for audit. Account-scope SQL is prepared, not applied. Chat history is trip context, not quota authority; retaining recent exchanges does not replenish quota. Route fares/durations require sourced dated quotes and remain outside budget until user-confirmed. Do not promise cached Aviasales offers can go straight to checkout.


2026-10-09 Structured transport supersedes prose-only alternatives: each Transfer has source-backed routeOptions (hemat/cepat/seimbang when researched), ordered connected legs, comparison summary, and selectedRoute chosen by account trip preference. Validate leg continuity, common overall endpoints and source allowlist; never fabricate alternatives, prices or direct rail continuity. Include requested sightseeing stops as well as overnight cities so excursions are not silently ignored; explain infeasibility instead of forcing a day trip. Replace unedited/unpaid generated transport including old day-plan simulation; preserve paid and userEdited records. Flight itinerary links reuse original validated Aviasales URL/tracking; legacy simulated flights require a real search and never receive invented affiliate URL.

2026-10-09 Transport recommendation policy: compare practical public/direct/connecting options with cost/time/transfer tradeoffs instead of default door-to-door taxi. Each researched multi-leg journey becomes ordered Transfer items, with source-backed endpoints and modes; explain alternative and pending verification. Existing route endpoints/protection supplied to AI without trusting them as verified operator services. Never assume border rail continuity, live price, availability, or universally best/cheapest route without evidence. Preserve paid/manual choices.

2026-10-09 Trip Pass recognition must not depend on draft having a saved ID. Read-only authenticated entitlement lookup uses the same city/date identity as AI quota. Purchase remains saved-trip and ownership gated; a paid pass for another city/date never unlocks current trip automatically. Show eligible scope and Perjalanan saya recovery; exhausted quota is not active AI access. Retain normal saved-trip payment reconciliation and quota RPC as authorities; no bypass or quota resets.

2026-10-09 Owner supersedes separate AI draft flow: generation auto-applies visits, hotel recommendations and transport to the existing daily itinerary. No second AI activity editor. Research is location-aware through per-day cities, retained hotels/manual/paid choices and explicit route endpoints; named hotels need research sources but are never declared available/booked. Replace covered unedited templates and previous unedited AI items, retain manual/selected/paid records and partial-night remainder. Store all categories in trip.items with unknown-price/source flags through existing save path. No automatic purchase, booking, account quota reset, invented live prices or coordinates.

2026-10-09 Owner requests Sol/Luna class Assistant for research/planning. Choose GPT-6 Luna low reasoning by default, with supported Sol choices through non-secret runtime model configuration. Separate web research from strict structured drafting to avoid unconstrained JSON/reference mismatch. Apply approved AI visits/transfers to existing daily itinerary via deterministic local helper, preserving paid/manual/flight/hotel entries. No generated live prices, hotel inventory, booking URLs or coordinates. Unknown prices remain visibly incomplete; lodging areas stay recommendations. No new browser/platform filesystem access or deployment authorized. Official Luna/structured-output capability docs checked; real provider contract test PASS, account UI persistence remains unverified.

## Product decisions

2026-10-09 Owner authorized Klook hotel affiliate widget installation locally. Hotel menu uses official widget instead of reachable simulated comparison results; manual itinerary lodging estimates remain separate. Preserve supplied ad/destination attributes and attribution. No automatic destination mapping, hotel selection into itinerary, API access or commission guarantee inferred from widget. No deploy authorization.
1. **Primary audience:** Indonesian travelers, especially first-time international and budget-conscious travelers.
2. **Product role:** AI travel planner and booking assistant/orchestrator.
3. **Booking strategy:** Initially direct users to partner/affiliate booking rather than trying to own all travel inventory.
4. **Monetization:** Affiliate transaction revenue is the primary early model. Premium and sponsorship are secondary/later.
5. **Trip Pass concept:** Rp15.000 per trip was considered acceptable as a potential paid product rather than relying on a conventional monthly travel subscription, because users do not necessarily travel every month.
6. **Flight scope:** Flight discovery should support worldwide travel.
7. **AI grounding:** AI must not invent prices, schedules, availability, visa rules, or other live facts that should come from APIs/data sources.
8. **Itinerary behavior:** AI itinerary drafts are editable and should not overwrite confirmed booking information.

## Engineering decisions
1. Current frontend uses React + Vite, not Next.js.
2. Backend uses Cloudflare Workers.
3. Supabase handles auth/database.
4. Local frontend and Worker should be independently runnable for testing.
5. Secrets remain in local/deployment environment stores and are not written into project-memory files.

## Agent/security decisions
1. Telegram is a task/status/authentication-notification interface.
2. Telegram text must never be executed directly as shell input.
3. Only an allowlisted Telegram chat may issue commands.
4. Sensitive authentication remains owner-controlled.
5. `/resume` is not proof that authentication succeeded; the agent must verify state.
6. Codex Desktop browser may use a manually authenticated browser session, but the agent must not read browser credential stores/cookie databases.
7. Do not broaden Windows filesystem access merely to make autonomous Codex CLI execution easier.
8. General Telegram → Desktop browser wake/resume automation is not considered complete until a supported bridge is verified.

## Viator implementation boundary — 2026-10-01

- Owner's masked screenshot proves enabled Production Basic Access. Prepare and test the backend in sandbox first per Viator documentation; owner alone configures secret values.
- Start with product search and provider-generated click-out links, not booking/payment APIs. No frontend live claim until real sandbox checks pass.
- Preserve Aviasales: owner confirmed existing connection; code uses Data API. Do not conflate this with eligibility for the separate Flight Search API.

## Documentation discipline
When new evidence changes product, partner, architecture, or progress state:
- update the appropriate project-memory file,
- do not silently convert assumptions into facts,
- use `UNVERIFIED` where evidence is insufficient.


## Per-day planning and paid-access UI — 2026-10-03

Group city/hotel/route changes under each day. Recommend catalog lodging or clearly labelled geographic search areas based on nearby itinerary visits; never substitute fabricated live inventory. Active server-verified Trip Pass uses compact status with details on demand; refresh on page return does not grant access from a redirect alone. Preserve Midtrans environment/owner gates. Hotel affiliate work deferred by owner; unaffiliated purchase CTAs remain unavailable.

Transport widget isolation — 2026-10-03: render exact official remote script in a static data-URL iframe (opaque origin), not app-origin inline script or app-origin allow-same-origin frame. Sandbox permits scripts/forms/popups and same-origin operations only within its unique data origin; no top navigation or app-session access. Accept readiness/size signals only from that frame; clamp dimensions. Never replace data URL with same-origin src/srcDoc under these flags.

## Search and account AI policy — 2026-10-05
Owner approved: AI requires login; two successful requests per account across trips; failure does not count. Exhaustion opens Trip Pass panel without automatic checkout and manual editing remains available. Preserve prompt/draft. Fixed positive duration has no14-day product cap; free duration starts with365-day duration window and can be expanded in365-day steps, subject to real provider coverage. Search summaries use existing estimates, not AI quota or fabricated live inventory. New quota reservation/finalization RPCs are service-role-only; migration requires review before deployment.

2026-10-05 Itinerary review placement correction: clicking the existing city/date card with ticket fare and itinerary estimate expands its own breakdown inline. Flight-choice navigation is a separate explicit action. Search prompt product name: SortTrip Assistant.

2026-10-05 Budget scope: owner removes meal costs from every segment. Current totals, paid/remaining balances, search estimates, itinerary breakdowns and saved-trip cards include flights, lodging, transfers and attractions. Historical meal records remain stored but excluded from active budgets/UI; new template/city/day/AI drafts do not generate meal-cost entries. Rest/meal time buffers remain scheduling considerations without prices.


## Manual partner selection boundary — 2026-10-09
Owner explicitly approved interim manual confirmation for12Go/Trip.com widget results. Public partner widgets remain isolated from SortTrip credentials; no private frame/storage inspection or fabricated selection callback. Select trip, name, date, origin/destination and optional per-person budget inside SortTrip, then add to draft and explicitly save. Preserve paid records; replacement is explicit and same category; hotel dates must match original covered stay. Multi-leg transport is retained when only one segment is selected. Use exact generated Trip.com affiliate links; do not append invented hotel/date parameters. Supplier checkout/payment remains owner-only.


## Successful AI results automatically persist —2026-10-09
Owner requests generated plans available in Perjalanan saya after leaving planner. Successful AI application (including legacy import) saves itinerary and conversation to owned account automatically. Manual edits and manually confirmed supplier choices still need explicit save. Failed persistence never triggers AI regeneration, quota reset, payment or fake saved status; local draft remains recoverable. Use snapshot reconciliation and draft identity guard for in-flight changes.
Trip.com exact public links must come from official generator; verified property registry rather than synthesized arbitrary tracking. CUBE Kampong Glam links directly to its verified property; other properties fall back to working affiliate hotel search until corresponding generated link or documented API support is available.


2026-10-11 Owner-approved quota revision: new grants10 results, preserve existing20-result passes. Repurchase allowed only when no unexpired pass has remaining AI results. Successful paid order grants via idempotent apply_trip_payment; no frontend grants or counter resets. Prepared trip-pass-10.sql for owner review/application; not applied. Brand wordmark horizontal with arrows to right; unified travel layout/buttons preserve existing journeys and partner/security controls.


2026-10-11 Flight replacement requires explicit in-app confirmation before rebuilding the whole current itinerary. Preserve trip identity/budget/preferences and source offer URL; prevent automatic replacement when any booking is marked paid. An existing AI itinerary regenerates through the normal account quota after replacement; disclose one successful result consumption. Never alter reservations at providers or silently reuse stale hotel/transport quotes.


2026-10-11 Purchased markers are explicit user-recorded paid flags, green/checkmarked, not automatically inferred from click-out. AI price refresh shares account successful-result quota; a successful batch costs one result, unavailable sources/failure none. Hotel reference prices from tiket.com and transport references from12Go require source identity, explicit IDR amount and unit. They are labelled reference estimates with checked time, not guaranteed travel-date inventory. Protect paid bookings and flight fares; incomplete transit fare coverage remains visibly incomplete. Preserve existing Trip.com/12Go affiliate booking paths separately from price-reference URLs.

2026-10-11 Partner replacement continues owner-approved manual confirmation: expose partner link/search from hotel/transport Edit, then automatically update and attempt cloud save of current itinerary after SortTrip form confirmation. Do not treat a third-party click as a selected booking or invent a callback. Reconcile lodging by night/date independently of map coordinates or AI dayPlan flags when changing catalog cities; remove obsolete summary, protect paid bookings. Price spelling equivalence at/@ may resolve the same named property, but all amount/source/unit checks remain. Unavailable price search preserves quota and amounts.


2026-10-11 Owner requests hidden website operation and actual Trip.com hotel prices inserted in itinerary. This supersedes hotel-reference-only pricing as the intended product behavior. Implemented optional anonymous browser path with dated inclusive totals; ordinary web search resolves property pages but cannot establish actual dated prices. Initial verified scope is one room, one/two adults, no children; unsupported scope remains unknown. Customer sees quote metadata only, never background browser. Supplier checkout can change the observed price. Local implementation is not production activation; see docs/HOTEL_BROWSER_SETUP.md.
2026-10-11 Trip saves are serialized; newer successful AI price/itinerary results wait behind pending saves instead of being discarded. Opening Perjalanan saya waits for writes and saves the latest dirty draft; database failure keeps the draft open. Insert IDs are reused for queued writes of the same draft to avoid duplicate trips. Implemented/tested locally; not deployed in this follow-up.
2026-10-11 While SortTrip Assistant is running, internal navigation stays on the active itinerary until completion or cancellation. Price column is shared across known/worldwide itineraries; unknown bookable items say Harga belum tersedia instead of implying free. Local implementation and visual verification; not deployed.
2026-10-11 Restore valid account-scoped itinerary view after reload/remount and persist dirty state. Price refresh is direct on-page action with visible successful-result quota cost; green success status requires accepted price changes plus successful save. Supplier-unavailable or unsaved results must not display green success.

2026-10-11 Owner explicitly approves background supplier browsing with a clean session per price request. Supplier browser contexts must be ephemeral and separate for Trip.com versus12Go, never import owner cookies/storage or expose browser windows to customers. Stop anonymous lookups at account/login/access gates; a fresh context is not permission to bypass or automate authentication. Browser-mode results require rendered date/guest/route/mode/IDR-unit evidence; unavailable browser inventory must not become a generic starting-price quote. Preserve affiliate booking links independently. Partial successful batches retain existing single-result quota semantics; total failure consumes none. Current exact guest scope is limited and must remain explicit in implementation/memory.

## ID/EN localization separation — 2026-10-11
Use i18next/react-i18next with Indonesian fallback and local preference before browser detection. Language affects presentation and AI prose, never category/kind IDs, supplier names, URLs, amounts or itinerary calculations. Existing currency remains IDR; Intl formatting accepts explicit denominations without invented FX. Restore supported user_metadata.language only when no local preference exists; synchronize the ordinary preference for Price Watch email rendering. No new SQL/RLS.
Translate existing AI narratives through a separate authenticated text-only endpoint instead of replanning. Validate exact numeric facts and URLs, retain original on failure, cache by account/language/text in bounded tab-session storage, never mutate the stored itinerary. This does not consume a new itinerary/price result; a separate per-user limiter bounds translation requests/provider cost. Single routes remain; HTML metadata changes at runtime, no hreflang aliases. Third-party pages/provider auth emails and user content remain outside automatic UI translation.

## Customer support isolation — 2026-10-12
Use public bilingual FAQ plus signed-in durable website conversations bridged to a separate support Telegram bot. Owner replies from an allowlisted private chat; never route customer/staff content into the existing natural-language project task queue. Dedicated SUPPORT_TELEGRAM_* secrets and webhook, independent SQL data/RLS/service-only writes, no AI or payment quota consumption. Preserve hourly Price Watch; support retries use a separate two-minute cron. Staff responses are asynchronous and shown in the website with status/history. Owner creates/configures credentials and applies migration privately; release/live verification separately authorized. See SUPPORT_SETUP.md for precise local implementation and unverified external steps.

2026-10-12 Tariff change prepared pending release: new purchases Rp30000 for10 successful results/30days. Owner postponed browser workflow optimization; existing heavy pipeline remains. Legacy invoices use their stored nominal amount, existing passes keep purchased allowance. Financial margin not verified; raising price does not guarantee profitability. Database amount constraint migration must precede backend/frontend release; production still15000 until completion. See TRIP_PASS_PRICE_30000.md.

2026-10-12 UI decision: concentrate itinerary-wide Change flight and Save in the planner heading. Flight summary shows schedule; daily rows retain booking and paid/source controls. Keep maps, route tools, price provenance, unknown-price warnings and stay duration. Mobile should expose budget categories rather than hiding them. Local visual refinement only; no release this turn.

2026-10-12 Hotel browser supports allowlisted Indonesian property pages/labels/Rp totals and observed lowercase date keys. Require exact rendered Indonesian dates as well as guest/night/property evidence; reject member/new-user prices and account/checkout navigation. Do not treat domain localization as anti-bot access remedy: actual id remote probe still encounters account gate; supplier-authorized access remains necessary before release.

2026-10-12 Owner selected separate hidden backend browser approach. Implemented opt-in authenticated HTTPS service adapter and loopback-only local service; customer devices receive prices through existing Worker/quota/save routes, no supplier window. Owner has no VPS; production external settings not activated. Fresh headless tests still lack room totals, so alternative hosting is an experiment, not a guaranteed access fix. No profile reuse, stealth, proxy rotation, account/CAPTCHA bypass or deploy.
# Release authorization — 2026-10-12

Owner explicitly replaced the earlier release hold with authorization to commit, push and deploy all accumulated product changes now for the hackathon audience, accepting unresolved supplier browser access and planning subsequent updates. Keep fail-closed price validation; do not fabricate prices, modify credentials, or publish owner authentication state. Local owner-login tools remain local tools, not public production endpoints. Real payment QA remains skipped by owner.
# AI hotel work reduction — 2026-10-14

Owner authorizes AI to select lodging neighborhood while LiteAPI searches hotels/rates and backend compares lowest checked eligible public total. Use deterministic API facts rather than hotel web-search/browser automation when enabled. Preserve paid/manual choices, occupancy/stay totals, provenance and successful-result quota semantics. Never compare API wholesale/package prices as unrestricted public rates or label LiteAPI prices as Trip.com. Current sandbox is QA-only; production access and supported checkout are separate owner-controlled prerequisites. No deployment authorization inferred from implementation request.
# LiteAPI-only accommodation UI — 2026-10-14

Owner explicitly removes Trip.com from hotel workflow and requests LiteAPI for the Hotel menu too. Replaced vendor iframe with native API form/results/trip-selection, removed active Trip.com hotel booking buttons and simulated hotel-planner comparison UI. No hotel property browser fallback remains in researchPrices; AI keeps sourced neighborhood when supplier unavailable. Owner confirms no White-label domain; booking stays unavailable until an official owner site is configured. Documented hotel-details deeplink provided, not speculative direct checkout. Google Maps API discussed only: no credentials, billing, calls or map-provider replacement authorized/configured by this turn.

# Google Routes free-cap allowance — 2026-10-14

# Native LiteAPI checkout — 2026-10-14

Owner selected Payment SDK alternative to blocked White-label. Build native separate checkout tab with authenticated immutable supplier selection, final terms consent and provider SDK; never collect/store card fields or silently debit wallet/owner card. Durable encrypted checkout attempts and stable provider clientReference prevent duplicate Book. Read-only reconciliation handles uncertain results; no false confirmation from redirect/payment-only. Sandbox owner-only first; separate live approval gate, SQL and real provider verification before production enablement. Trip Pass/AI quotas and customer itinerary editing remain independent. White-label no longer required for this checkout path; its support case remains open independently.

Latest owner accepts safer9000monthly cap and explicit Google Maps link fallback. Backend and SQL enforce maximum9000even if a higher environment value is supplied. Keep1000daily/5userdaily; reserve1000published free events for other use/tests. Account-wide external usage can exceed the reserve, so no guaranteed zero billing. Links are user-clicked, never automatic itinerary redirects. Supersedes10000application allowance below, not Google's published entitlement.

Owner requests maximizing allowance within monthly free usage. Official current global pricing: Compute Routes Essentials10000/month. Fixed basic request builder contains no documented higher-SKU triggers; protect against client injection of higher-tier options. Local defaults now10000monthly/1000daily with unchanged5per-user/day. Monthly counter aligns with Google's US Pacific month, daily remains Asia/Jakarta. Count attempts, stop before upstream when exhausted, no retries. Account-wide same-SKU usage outside this counter consumes the same free cap and requires lower owner-configured allowance; no zero-cost guarantee without live billing verification. No Google billing/credential/Console changes, migration execution or release authorized/performed.


## Google Routes production activation — 2026-10-22
Owner explicitly requests production enablement after code release. Record GOOGLE_ROUTES_ENABLED=true as nonsecret in both Worker configs so local-only setup does not leave deployment disabled. Preserve existing runtime limit overrides with --keep-vars; no credential or billing changes. Backend atomic budget remains mandatory before supplier call, hard9000monthly/1000daily, accountdefault5daily. Results temporary and user-initiated, independent of Assistant successful-result quota/itinerary edits. One actual production WALK success establishes activation, not all transport fares or guaranteed zero billing.

## 2026-10-22 Viator pricing and itinerary selection
Use actual API products and provider-generated affiliate URLs; do not invent destination IDs, affiliate tags, exact availability or automatic matches. Resolve city exactly before free-text product search to prevent unrelated-country suggestions. Owner explicitly selects product; keep itinerary price unchanged unless they opt into a starting-price estimate. Store supplier fromPrice separately from manually selected/dated-option reference, since cheapest variant may use a different cable-car line or scope. Protect paid items and reject stale selection context. Buying remains on Viator; public detail inspection is not a booking or final quote. No background AI generation/quota consumption to perform ticket search.

## 2026-10-22 LiteAPI endpoint fee policy
Only explicitly reviewed standard-free hotel method/host/path pairs may leave the Worker; use shared assertLiteApiFreeEndpoint in every LiteAPI caller. Places, price-index, flight and unknown endpoints remain blocked. Review sentiment processing staysfalse. This is a code egress restriction, not an unconditional supplier fee promise: ToS/fair-use/commercial agreements and account add-ons still govern. No financial activation or credential change from owner Production screenshot alone.

## 2026-10-22 Hotel menu versus itinerary supplier
Owner chooses Trip.com affiliate SEARCH BOX for standalone Hotel menu while White-label remains403. Use original registered desktop/mobile IDs and tracking; record affiliate choices manually only. Hotel alternative search opened from itinerary retains Nuitée catalogue/rates and native PaymentSDK route. This does not reactivate Trip.com browser price scraping or replace LiteAPI AI-area pricing. Nuitée production checkout requires separate owner financial review/test; static SDK200 is not live-session proof. Owner reports LAS-3185 unanswered.

## 2026-10-22 Separate public SSP floor from authenticated checkout payable
Public hotel discovery/itinerary quotations retain max(retail total, SSP). Verified logged-in native checkout is the member channel and uses supplier retail total (includes provider-configured commission) consistently for room selection and Prebook validation. Public minimum selling price is not an independent amount to charge in SDK; do not compare it to the SDK payable. No account margin or billing configuration modified. Source: Nuitée official revenue-management guide permits logged-in CUG pricing; rates JSON guide distinguishes SSP from payable retail total. Price/tax/room/cancellation/session checks and owner-only consent/payment remain mandatory. Actual SDK session amount still validated, no silent price change or payment fallback.

## 2026-10-22 Review valid supplier changes before payment
Supersedes initial checkout policy that any Prebook price/policy/room change must fail and force re-search. When supplier response passes identity/date/occupancy/tax/payable/session checks, retain confirmed final quote and session, display previous vs current amounts, changed room, meal plan and cancellation terms, and require separate fresh final consent before returning SDK credentials. Inconsistent payable or invalid/incomplete supplier details remain blocked. Never auto-accept changes or Book. Historical failed sessions lacking stored SDK payload cannot be resumed.

## 2026-10-22 Owner-published Nuitée markup5%
Owner chooses and personally publishes static default hotel markup5% in Nuitée production; direct page reload confirms persisted active5%. Continue inheriting provider account default, with no extra application markup/additionalMarkup and no paid managed dynamic pricing add-on. Markup is measured on net rate (5/105=4.76%of final selling price). Fresh quotes reflect setting; do not rewrite saved trips or in-flight checkout prices automatically. Actual earnings/payout remain subject to booking/stay/partner terms.
# 2026-10-23 — Explicit replacements and independent directions

Current-message explicit edit intent can release unpaid accommodation/attraction selections, with day-scoped attraction edits preserving other days. Paid items remain immutable. Replacement hotels require supplier identity and complete previous-stay coverage; missing matches preserve the old stay with unmet-budget feedback. Hard hotel ceilings are per room/night from public supplier stay totals, never an AI price. Admission/coordinate research facts are nullable references with exact excerpt, source and identity checks; unknowns are not free, foreign currency is not silently converted. Build hotel/visit/return text directions independently of map coordinates and generated transit suggestions; Google API checks stay explicit-click only. Preserve qualified excursion locations and avoid incomplete polyline claims. This is a local change, not a new partner entitlement or production release.


## 2026-10-23 — Distinguish purchase provenance
Manual marks, partner-reported affiliate purchases and supplier-confirmed hotel reservations are separate states. Opening a link never proves a purchase. Only private live exact-context hotel evidence may automatically mark hotel paid; affiliate reporting never proves airline issuance. Pending hotel reservations block automatic replacement; cancellation never implies refund. Client JSON provenance is a hint, not proof. Saved hotel updates require optimistic concurrency. Affiliate query must discriminate booking from paid clicks and fail closed if unsupported; current Travelpayouts400 leaves flight evidence unavailable.

## 2026-10-23 — Use live Travelpayouts schema for booking discriminator
Correction to previous HTTP400 limitation: action_type in a documentation example is absent from actual campaign100 metadata. Prefer supported sub_type=booking, with action_type only if explicitly advertised; never force an unknown filter. Require returned booking discriminator/type=action/campaign100, exact scoped subID and valid action state. Do not fill missing discriminator as booking. Upstream200 with empty results means checked/no matching report, not a failed or successful purchase.

## 2026-10-24 — Transactional hotel replacement
Retain prior AI lodging until a requested replacement has validated supplier price, full stay coverage and requested nightly budget. Prevent ID collisions with retained items, and preserve quote linkage when allocating new IDs. Protected/overlapping stays must reach stable coverage before removing any original item. Hotel search targets receive priority over transfer fanout; explicit AI budget searches reuse city/rates budget discovery and existing deadline/fee policy. No automatic reconstruction of overwritten hotel prices or new booking. Local implementation, not a release.


## 2026-10-24 — Recommendation budget policy
Owner requests Budget mulai cards, monthly real-price collection and mean/sample deviation for transport/attraction tickets only. Hotels use the current cheapest eligible API sample; target<=IDR500000/night, with the cheapest higher rate accepted when no qualifying cheaper sample exists (explicit owner clarification, including Singapore). This is a recommendation preference, not permission to exceed a traveller's explicit search maximum. Never average hotel rates or fabricate annual history. Single ticket sample has no SD; missing flight/hotel suppresses numeric budget. Flight planning floor=max(min,mean−SD), plus3hotel nights+4food allowances, rounded up50k. Local/airport transport and paid attractions remain excluded until comparable prices are available; supplier starting-price references are separate from dated admission fares. Explore is the initial view; stored drafts remain restorable.


## 2026-10-24 — Recommendation duration and stay totals
Recommendation durations are destination-specific: Hanoi5days4nights based on actual cached fares, KL/Singapore4days3nights. This replaces the fixed4-day assumption for every card, without widening an explicit traveller search. Pool ticket statistics only within the same duration. Server publishes hotelTotal=nightlyMinimum×nights, foodTotal=allowance×days and one return-fare component; UI displays whole-stay hotel cost plus nightly multiplication. PP fares are not doubled. Different-date component samples remain planning floors rather than bookable packages.


## 2026-10-24 — Customer-facing budget copy
Owner supersedes earlier request to expose methodology in recommendation details: do not show statistical methods, sample counts or supplier selection rules to travellers. Keep itemised costs, whole-stay hotel duration/total, update date and exclusions. Preserve internal real-price sampling/mean/deviation logic and audit documentation. Local implementation, not yet released.


## 2026-10-24 — Approved SortTrip identity
Owner supplied final pin/S/coral-dot artwork and explicit implementation brief. Replace the former arrow wordmark with a faithful vector reconstruction; use approved navy0B2D3A, teal0F6E8C, cyan0B8DB0, bright0EA5C9, coralFF6B4A and offwhiteF7F7F5. Brand name SortTrip; taglineID Sortir tiket, susun itinerary / EN Travel smarter, plan better. Central tokens serve React/static pages. Light remains product default; matching dark CSS/assets without adding a preference toggle. No automatic deployment; original vector/font absent, so reconstruction/SegoeUI outlines require visual review rather than a pixel-perfect claim.


## 2026-10-24 — User-selected AI protection
Owner explicitly replaces implicit userEdited protection with aiLocked. Manual edits remain provenance only. AI may revise unlocked unpaid itinerary selections, retaining requested day scope. Paid and pending bookings always protected. Preserve verified accommodation until complete valid supplier replacement exists; explicit locks also exclude AI price refresh. Locks persist in existing trip JSON; user saves via normal itinerary save. No provider/payment permission changes.


## 2026-10-24 — Itinerary chronology and admission evidence
Reject transfers ordered after their destination visit or before their origin visit; preserve paid/pending and explicit AI locks. Known route targets may be researched concurrently to reduce latency without inventing routes. Google browser ISO timestamps include milliseconds and are accepted. Museum references use fixed official URLs and exact identities; a manually verified 24 Oct reference may survive refresh failure for 30 days with its original checkedAt, never relabeled live or silently converted into IDR totals. Unknown category costs display unavailable/partial rather than a zero claim. Map coordinates for the two museums are OSM sourced, not Google data stored on OSM.


## 2026-10-24 — Viator city-state resolution
Same-name destination matches are resolved only if a unique candidate is the explicit direct child of every other exact-name candidate, using provider parentDestinationId. This handles Singapore country/city hierarchy without arbitrary first-match fallback or hardcoded guessed IDs. Unrelated ambiguous cities remain rejected.


## 2026-10-31 — Asisten diganti OpenAI ke Meta
Atas instruksi owner, mesin SortTrip Asisten (dan terjemahan narasi) diganti dari OpenAI Responses API ke Meta Model API muse-spark-1.3 (allowlist juga muse-spark-1.1 via META_MODEL). Skema itinerary, kuota Trip Pass, dan validasi deterministik dipertahankan; loop agen maksimal 3 putaran (riset web_search -> draft -> satu koreksi). Meta hanya mengorkestrasi: harga/fakta tetap dari Aviasales, LiteAPI, dan sumber pemasok; Meta memilih Area menginap, LiteAPI memilih properti. Input multimodal asisten fase ini: gambar JPEG/PNG/WebP (maks 3). Kunci server: META_MODEL_API_KEY (alias META_API_KEY/MODEL_API_KEY), tidak pernah ke browser. Terimplementasi lokal + tes mock; belum live/deploy/commit. Lihat qa-reports/META_ASSISTANT_ENGINE_2026-10-31.md.


## 2026-10-31 — Input link sosial tanpa unduhan
Atas keputusan owner: asisten menerima link TikTok/Instagram/Threads sebagai inspirasi. Hanya metadata resmi (oEmbed TikTok/Threads) yang dibaca server; Instagram tidak punya jalur metadata resmi sehingga ditandai tidak tersedia. Tidak ada unduhan video, tidak ada penyimpanan media, tidak ada gerbang tinjauan wajib di halaman awal; bukti ditandai belum terverifikasi dari isi video dan kota yang tidak jelas wajib dilabeli 'Lokasi belum dapat dipastikan.' di ringkasan. Panel bukti opsional tertutup; koreksi di halaman itinerary. Lihat qa-reports/SOCIAL_LINK_INPUT_2026-10-31.md.


## 2026-10-31 — Guard biaya Meta jalur asisten
Tindak lanjut temuan QA Codex (jalur asisten memanggil Meta langsung, output s.d. 10000 token): ditambahkan guard murah tanpa migrasi DB dan tanpa mengubah budget/cutoff — outputCap via META_MAX_OUTPUT_TOKENS (hanya menurunkan), penolakan overrun usage (502 AI_PROVIDER_OVERUSE, kuota dilepas gagal), dan batas hitungan panggilan per permintaan (default 8 via META_MAX_PROVIDER_CALLS 4-20). Perilaku default tidak berubah. Lihat qa-reports/META_GUARD_2026-10-31.md.


## 2026-10-31 — Caption tempel dan anywhere mengikuti prompt
Temuan: oEmbed TikTok tidak mengembalikan caption/judul (terbukti panggilan langsung + docs resmi), sehingga bukti link kosong; prompt pencarian awal juga tidak dipakai. Keputusan: (1) kolom tempel caption di asisten sebagai bukti utama (caption saja sah); (2) aturan anywhere: tujuan 'semua' + prompt terisi + login => POST /api/destination me-resolve SATU kota via Meta lalu pencarian tiket ke sana; prompt kosong/gagal => fallback daftar semua termurah. Resolve memakai auth, rate limit, kuota Trip Pass (sukses dihitung bila kota ketemu), cap 800 token, cek overrun; tanpa migrasi DB. Kota trip tetap acuan itinerary demi koherensi penerbangan. Lihat qa-reports/CAPTION_ANYWHERE_PROMPT_2026-10-31.md.


## 2026-11-01 — Keputusan konsep: prompt memicu itinerary lengkap
Perjalanan dari pencarian dengan prompt terisi (user login) otomatis menjalankan satu penyusunan AI saat halaman perencana terbuka; prompt kosong tidak memicu (hemat kuota). Itinerary lengkap (plan, harga, hotel LiteAPI, transfer, peta) berasal dari jalur /api/itinerary yang ada; tanpa pemicu untuk trip non-prompt.

## 2026-11-01 — Konteks AI konsisten lintas provider
Owner meminta konteks platform konsisten termasuk bila nanti berubah ke Muse. Implementasi lokal: sumber tunggal worker/platform-context.js, versioned instruction envelope at egress, per-stage instructions preserved and translation separately scoped. Feature/context maintenance recorded in AGENTS.md and docs/AI_PLATFORM_CONTEXT.md. This does not authorize provider activation or restore historical hackathon rules; OpenAI remains active source. No UI/schema/quota change.

## 2026-11-01 — Adapter Muse multimodal tanpa mengganti platform
Owner memilih mempertahankan UI/database/editor/booking existing dan menambahkan Muse adapter, teks/gambar/video serta pencarian terbatas saja. Implemented locally opt-in; default OpenAI dan normal authorization/quota tetap. Media research-only dengan consent, tanpa media storage/social downloader. Dua supplier functions read-only, batas token/call/loop, fail-closed config/billing attestation/expiry; tenggat absolut Meta existing tetap5Nov00WIB. Tidak mengaktifkan/mengubah credential, budget, ledger, schema, staging atau deploy. Hard biaya akun/provider dan live compatibility masih memerlukan verifikasi owner sebelum aktivasi; tidak diklaim dari tes mock. Bukan izin membuat AI Guide atau tool booking/write.

## 2026-11-01 — Mesin AI lokal Muse; OpenAI dinonaktifkan
Owner meminta peran OpenAI nonaktif dan memperbolehkan kuota sampai uji berhasil. Launch lokal normal/Muse/hotel-browser sekarang memilih Meta dan OPENAI_DISABLED=true, diblokir sebelum egress planning/translation tanpa fallback. Kode kompatibilitas disimpan untuk menjaga perubahan terbatas; tidak dipakai runtime lokal. Website online belum dirilis ulang. Muse teks+foto melalui normal authenticated UI terbukti tersimpan/reload; paid/locked guard dan batas token/call/cutoff tidak dilepas. Riset boleh merekonsiliasi konteks web yang baru ditemukan hingga hard caps; angka unknown tetap unknown. Tidak klaim hardUSD/account billing terverifikasi.

## 2026-11-02 — SortTrip Guide terpisah dan berdasarkan konfirmasi
Owner meminta Guide hanya aktif setelah itinerary final dan tombol aktivasi. Guide menjadi modul/dialog terpisah, tidak mengganti Assistant/editor/booking. Checkpoint berbasis jadwal tidak menyatakan kedatangan tanpa GPS memadai/konfirmasi manual. GPS foreground opsional; bantuan otomatis opt-in, dua sampel akurat, cooldown30menit, maksimal3/sesi/sekali checkpoint dan kuota existing. Riset/AI tidak berjalan saat membuka panel. Saran bukan perubahan: paid/bookingHold/aiLocked dilindungi, penerapan jadwal memerlukan persetujuan lalu Save existing. Rekomendasi alternatif transportasi/tempat berupa kartu; penerapan otomatis MVP hanya jam/hari kegiatan existing yang tidak terlindungi. Tidak ada booking/cancel/payment tool, schema/credential/production change atau background location. Cutoff existing5Nov00WIB tidak diubah.
## 2026-11-02 — Guide sebagai halaman jalur + chat
Owner memilih Guide di menu sendiri: jalur checkpoint bergaris/pin brand, detail wisata+transport berikut, chat kecil untuk pertanyaan dan konfirmasi. Ini menggantikan modal lama. Confirm+Save dari chat menyetujui versi baru sehingga Guide tetap aktif dan checkpoint langsung diperbarui; ini menggantikan pause wajib setelah penerapan yang disetujui pada desain awal. Edit eksternal tetap pause. Tidak ada perpanjangan cutoff atau pelepasan proteksi booking. Implemented/tested local only.
### 2026-11-02 — Jelajahi bebas durasi/budget dan media handoff
Owner meminta multimodal di Jelajahi, default Berapa hari pun dan Berapa pun. Budget0 adalah sentinel tanpa ceiling; bukan gratis. Pertahankan supplier duration coverage, numeric budget pilihan user/recommendation, auth/TripPass dan tombol Generate existing. Foto/video hanya state sementara, diteruskan setelah memilih flight, tidak disimpan pada Trip. Tidak auto-inference saat pencarian. Implementasi lokal, belum release.

## 2026-11-02 — Aksen biru desktop mengikuti ilustrasi
Atas arahan owner, desktop terang memakai aksen biru #0075CF dengan hierarki font dan proporsi panel lebih compact. Logo asli dan identitas toska Guide dipertahankan; mobile/dark tidak ditimpa lapisan baru. Keputusan visual tidak mengubah kapabilitas, konteks AI, default, alur atau otorisasi platform. Implementasi lokal, belum deploy.


## 2026-11-02 — Guide mengikuti ilustrasi03
Owner memilih desain03 khusus Guide: checkpoint mobile-first, detail fokus, chat panel bawah dan aktivasi bertahap. Desktop memakai jalur satu kolom760px; navigasi existing dipertahankan. Aktivasi/jeda tersedia di jalur, tidak diulang dalam detail. Foto tiap checkpoint hanya jika sumber lokasi tepercaya tersedia; sementara ikon kategori tanpa klaim foto. Semua handler/guard AI, GPS, paid items dan Save tetap. Implementasi lokal, belum release.


## 2026-11-02 — Meta tanpa cutoff kalender (keputusan owner terbaru)
Owner mencabut penghentian otomatis 5 November dan mengizinkan commit, push, serta deploy existing Worker sorttrip. META_ASSISTANT_EXPIRES_AT kini diabaikan; enable/billing/key, autentikasi, Trip Pass/kuota, timeout, batas token/call/tool dan larangan fallback tetap berlaku. Tidak ada migrasi, reset data, perubahan credential atau inferensi tambahan pada proses rilis ini. Bukti rilis dicatat di qa-reports/RELEASE_2026-11-02.md.
