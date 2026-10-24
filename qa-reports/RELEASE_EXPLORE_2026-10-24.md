# Explore recommendation release —24October2026

Published to [SortTrip production](https://sorttrip.yusufridlo7.workers.dev/).

- Application commit: `2017a0d`, pushed to `origin/codex/qa-production-readiness-2026-10-23`.
- Cloudflare version: `ede52a3d-de0e-4cad-8945-9a5433c82f9a`.
- Previous version / rollback reference: `988ab353-df62-4c4f-8466-bb129432e217`.
- Deployment: `wrangler.hotel-browser.jsonc --keep-vars`; existing dashboard variables and credentials retained.
- Published JS: `/assets/index-DLNEU2nH.js`; CSS: `/assets/index-BIgIDcl3.css`.

## Released behaviour

Explore is the initial page, with stored drafts restorable. The unused welcome panel was removed and the top section compacted. Photo/city/budget cards open sample itineraries and a concise cost breakdown; calculation methodology/statistics remain internal. Hanoi uses five days/four nights, the new sunset panorama, return airfare and a whole-stay hotel total. KL/Singapore use four days/three nights. The AI panel receives real progress stages and animated dots with JSON compatibility and cancellation preserved.

Verified initial budgets: KL3.15m, Hanoi7.1m, Singapore5.45mIDR for one adult fromCGK. These are planning component samples, not locked package prices. Local/airport transport, paid attractions, additional baggage and insurance remain excluded. Hotels prefer<=500k/night but use the cheapest higher sample when none meets that target. No explicit traveller search maximum is relaxed.

## Checks

-303 existing/new automated tests passed, final production build passed; i18n1467keys with no coverage errors/untranslated JSX literals. Existing main-bundle size advisory remains.
-Production homepage and exact deployed JS200; health200.
-Production `/api/recommendations`200, budgetVersion2, three cities, current capture. Hanoi5days/4nights/return, hotelTotal1,354,480.25 and Budget7.1m verified.
-Deployed Hanoi photo byte hash matches the new local photo.
-Actual unauthenticated SSE request returns initial `validating` stage and terminal401. HTTP200 is the stream transport response, not successful AI authorisation. No model call/quota debit performed.
-Official production browser verifies compact homepage, all three prices, Hanoi card and expanded cost-only detail; no formula/sample/SD explanations visible. Desktop1280×900 and mobile390×844 inspected. No saved-trip edit or financial transaction.
-Dedicated KV namespace was empty before initialization. Wrote `snapshot:2026-10`, `history`, `published` from the verified seed. Binding and refresh flag are deployed. Daily02:00UTC/09:00Jakarta cron checks monthly completion; October snapshot prevents redundant initial collection. Existing hourly watch and two-minute support schedules retained.

Evidence: `artifacts/explore-release-tests.tap`, `explore-release-build.log`, `explore-release-production-smoke.json`; production screenshots in `qa-reports/2026-10-23/evidence/explore-release-production-*.png`.

Still unverified separately: a real signed-in full AI generation after the stream release, year-long price coverage/numerical deviation from additional samples, comparable ground fares, Singapore activity search400, supplier financial lifecycle and affiliate settlement. Do not initiate a purchase/paid AI result solely to manufacture evidence. Financial configuration and credentials were not changed. Unrelated WORKFLOW.md deletion, environment example, raw artifacts and old report backups were excluded from the commit.
