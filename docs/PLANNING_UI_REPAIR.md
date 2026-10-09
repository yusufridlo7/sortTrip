# Planning UI repair — 2026-10-09

## Implemented locally
- Restored map/routes in worldwide planner; catalog and global trips are safe with missing coordinates.
- Exact catalog AI place matches retain approximate map markers; unknown coordinates are never invented. All daily places and route legs remain accessible through Maps links.
- Full-width multiline Assistant composer and two-way successful exchange history, stored with the itinerary; latest6 messages are bounded planning context. Save remains explicit.
- Shared account Trip Pass entitlement, preserving payment audit trip identity and20 successful result limit per purchased pass. New trips do not reset usage.
- Select researched hemat/cepat/seimbang route options; paid route selections protected. Each transit leg has its own Maps link; cross-border endpoints no longer receive the same city suffix.
- Route contract includes nullable dated source-supported fare/duration quotes. These references never silently enter budget. Unknown fare is explicit.
- Hide heuristic local mode recommendations where AI researched route options exist.
- Original selected Aviasales search/offer URL preserved. No fake checkout or fare guarantee.

## Verified
107 fixture regressions PASS. TypeScript/Vite build PASS; existing large-bundle warning remains. Official browser local Kuala Lumpur map shows real OpenStreetMap tiles and markers; Assistant textarea measures823px wide and129px high on observed viewport. Original selected flight purchase link appears in header and daily list. No payment performed or authenticated trip automatically saved.

## Owner action / limitations
1. Review and apply `supabase/ai-pass-account-scope.sql` through Supabase SQL Editor. Prerequisites: existing AI reservations, trip passes and Price Watch installation. It only replaces scoped functions and preserves usage/expiry, security-definer role restrictions and account locks. No live SQL was executed. Verify cross-trip quota after application; local UI cannot by itself override the old database function.
2. Google Maps-like live route/transfer/fare calculation requires an official routing and geocoding provider. Current code does not connect Google Routes API. Google fare is available only when the provider knows fares for all transit steps. Do not treat research-based AI suggestions as live routing or claim cheapest without comparable fare evidence.
3. Aviasales Data API returns cached offers/search links, not guaranteed direct supplier checkout. Preserve selected link and confirm final choice/price at partner. Live Search/booking-link entitlement would require separate official partner review.
4. Fresh real AI generation, fare evidence quality, two-way chat save/reload, global-map responsive rendering and live account quota remain to be verified. No extra paid API call was spent in this repair.

## Official references
- https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API
- https://developers.google.com/maps/documentation/routes/transit-route

No credential values read/changed; no commit, push or deployment.

## Follow-up after owner SQL application
2026-10-09 Follow-up: owner reports account-scope SQL successfully applied. Official browser authenticated local unsaved Kuala Lumpur draft recognized15 remaining Trip Pass results. One real Assistant generation succeeded, populated daily itinerary and two-way chat, and remaining quota changed15 to14 exactly once. Reload preserved draft/chat and14 remaining, with Belum disimpan still shown; no cloud save performed. Visible route Travelodge -> walking to LRT Pasar Seni -> Kelana Jaya Line to KLCC -> walking to KLCC Park, with return connection. Fares remain unverified explicitly; no live Google routing/checkout claim. This verifies normal successful quota consumption on a draft; exact different-city comparison and exhausted/concurrent live scenarios were not separately exercised. No quota reset/grant, payment, secret read/change, commit/push/deploy. Status summary added via read-only account access endpoint; build PASS.


## Hotel / transport partner handoff —2026-10-09
Implemented owner-approved interim manual selection confirmation, Trip.com hotel search iframe, contextual itinerary/map actions, and AI preparation status. Partner form date validation, unknown-price handling and replacement protections have4 passing new tests; full targeted suite111/111 PASS and build PASS. Official browser verified hotel widget fields and contextual hotel name/dates. No actual checkout or supplier-result callback tested; no additional real AI generation. No secret read, quota reset, commit/push/deploy. Public affiliate link construction does not guarantee attribution or exact product checkout.
