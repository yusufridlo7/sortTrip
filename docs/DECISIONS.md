# SortTrip — Decision Log

## Product decisions
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
