# SortTrip — Decision Log

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
