# Viator follow-up — 24 October 2026

Owner privately replaced the local production key and confirmed it saved. Restarted the local Worker using wrangler.hotel-browser.jsonc without a CLI environment override. No secret values or secret files inspected or changed by agent.

## Verified results

- Health: production, configured=true.
- Fresh KL search HTTP200 after restart: the earlier upstream401 is resolved for this runtime/key.
- Singapore originally still400: actual provider destination results contained Singapore city60449, parent country18 named Singapore, and country18 under Asia2. The old exact-name uniqueness guard rejected this legitimate city-state hierarchy.
- Resolver now selects the unique direct child only when every other exact-name match is its explicit parent. Unrelated namesakes still fail closed; no arbitrary first result, guessed ID or diagnostic candidate payload is returned to clients.
- Fresh fixed Singapore/Gardens by the Bay query HTTP200/six products. Examples start IDR174856.64 and276856.35; options differ.
- Fresh KL/Awana SkyWay query HTTP200/six products, including Genting Highlands Awana SkyWay Cable Car Ticket57373P326, IDR72856.94 starting price.
- 13 focused Viator tests and329 full regressions pass. Worker-only change; no frontend bundle change. `git diff --check` passes.

These are production-provider starting prices, not exact-date/participant/option availability or a confirmed booking. Search results may include related tours; do not automatically treat a bundled tour as the requested standalone ticket. No itinerary changed, AI quota consumed, booking/payment, commit/push/deploy or credential modification performed.

Evidence: `evidence/viator-owner-key-retest.json`, `evidence/viator-fixed-live.json`, `evidence/viator-followup-tests.log`.

This supersedes the local Viator401 blocker in QA_REPORT.md. The Singapore resolver fix is local and awaits an explicit release instruction. Other audit limitations remain.
