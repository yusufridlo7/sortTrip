# Production deployment — 30 Oktober 2026

DEPLOYED existing sorttrip: https://sorttrip.yusufridlo7.workers.dev
Version b24bc674-7451-4052-a87f-5d63603218f5. Owner approved SQL01/02/03 action-time execution and attested production bindings. Secret-name presence verified, no secret values exposed.

SQL01 paid discovery: Success. SQL02 initial ledger: allocated0/limit0/blockedtrue/requests0. SQL03 activation: allocated0/limit100/blockedfalse. Postflight read-only: RLS=true, rpc_secure=true (postgres owner, SECURITY DEFINER, empty search_path, service EXECUTE, anon/auth denied), baseline_unchanged=true, requests0. QA ledger/entitlements not copied or changed.

Final targeted tests31 PASS0 FAIL. TypeScript/Vite build PASS. Production frontend bundle contains production Supabase configuration; QA reference literal remains in validation helper, not evidence of QA client selection. Worker flags META_ITINERARY_ENABLED/META_AI_BUDGET_READY true; cutoff2026-11-04T17:00:00Z in both production configs and hard-coded server guard. DB reserve also checks cutoff. No retries/provider fallback.

Smoke: homepageHTTP200; anonymous discoverPOST401; accessGET405 expected method restriction (not authentication proof). Authenticated browser existing session loads MyTrips with existing saved trips. UI theme deployed. No new paid inference, supplier test, booking or payment. Editing/save/reload after this deployment not yet exercised; historical QA proof is not production E2E proof. AI Guide production functionality not verified.

Evidence: artifacts/production-postflight.png, production-my-trips.png, production-deploy.log, production-final-tests.tap, production-final-build.log. Rehearsal46 PASS earlier, synthetic PG18.6 vs actual production17.6 now migration applied successfully. No commit/push.

Next: manual edit/save/reload verification using a clearly identified test itinerary, then one controlled paid production inference only if explicitly authorized. Record hackathon demo and verify AI Guide claims. Rollback: restore prior Worker/disable flags; retain ledger and history, never reset allocations.
