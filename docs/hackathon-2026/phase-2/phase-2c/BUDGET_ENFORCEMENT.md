# Budget enforcement

**Current status: sequential SQL, actual Worker reserve/settle and owner-operated overlapping-session lock test VERIFIED LIVE.** Owner final SQL after text/frame tests: allocated0.15/remaining9.85/blockedfalse, requests3/settled3/unsettled0, known estimated usageUSD0.01032150. Earlier blocked checkpoints below are historical. Owner cumulative ceiling USD10, not target; per-request allocation0.05, max10allocations/user. Allocation retained after unknown usage/timeouts; no automatic refund/reset.

Actual owner probe nine checks passed; rollback0/10/false confirmed before Phase2C. New original concurrencyB resultfalse means actual independent lock contention was not demonstrated. It does not establish a specific cause or a successful parallel cap test.

Updated supabase/meta-video-concurrency-a.sql adds an advisory transaction marker while holding the actual global budget row lock20seconds. B first proves A is still active in another session, then calls actual reserve with2second lock timeout. Both booleans must be true; subtransaction rollback removes any temporary writes. Revised scripts not yet owner-verified. A marker proves the test overlaps sessions, not parallel exhaustion by itself.

Worker diagnostic /api/meta-qa/budget-probe authenticates QA user, checks origin/localhost/fixedQAproject/rate/body, reads aggregate allocation, then reserves/settles one0.05 allocation only after explicit diagnostic action. No Meta call. Read-status action performs no writes. Reserve test consumes one test allowance permanently if reached; no automatic retries.

Actual first diagnostic stopped at budget-read; repeated read-only checks showed upstream403 and safely classified PostgreSQL42501 as DATABASE_PERMISSION_DENIED. No reserve/settle was reached. Service-only aggregate SELECT patch prepared in supabase/meta-video-budget-service-read.sql; owner selected that they would run it, but no successful runtime readback yet. Do not infer bad key or rotate credentials. No arbitrary upstream error text is returned.

Worst planned inference at20k input/2k output and current Standard rates: USD0.0335, no tools/retries. Token-count documentation distinguishes count from generation usage; actual payload/account usage still unverified. Keep0.05allocation; do not claim it caps every possible provider/account charge. Gate failures prevent live inference. Mock timeout/unknown usage/exhaustion and no-bypass coverage remains in fullsuite and new diagnostic tests.

## Resolved budget gates — 27 October2026
Owner SELECTpatch threebooleansalltrue; actualQAUIreadbacksuccess followedbyoneactualWorkerreserve+settle withunknownusage, allocation0.05/remaining9.95. Ownerreports revisedBv2bothpassedtrue, provingowner-runoverlapmarker andexpectedglobalrowlocktimeout; notagent-executedSQLor200parallelallocations. Agentpostconcurrencyreadconfirms0.05/9.95/blockedfalse. Original403andBfalsecheckpointsaresuperseded. Do notresetconsumed0.05. OneauthorizedsyntheticMetaQArequestisnowbeingattempted; outcome/usagewillberecordedseparately. Noadditionalconcurrency/grantsetupneededfortheseresolvedchecks.

## Actual settlement and schema evidence — 27 October2026
Owner supplied meta-qa-live-check.sql result: allocated0.100000, remaining9.900000, blockedfalse, requests2, settled2, unsettled0, known_estimated_usage_usd0.00620550. Matches one0.05runtime diagnostic plus one0.05inference allocation, with actual recordedusage from inference. This verifies settlement at database aggregate level; not finalMetaaccountbilling. OwnerSQL also proved tripsabsent; ownerthenappliedexistingsupabase/schema.sql andreportedSuccess. No newkey, noRLSweakening, noagentgrantSQL. Onepost-schemaSaveattempt nowshows actualUI Tersimpan; databaseReloadverificationinprogress.
