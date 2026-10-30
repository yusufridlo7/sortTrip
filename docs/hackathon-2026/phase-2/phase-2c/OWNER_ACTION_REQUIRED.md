# Owner actions — Phase2C

**Current status PARTIAL. Do not proceed to Phase3 or production release.**

**Latest completed checkpoint, 27 October2026:** Sections1–3 and the remaining-second-account prerequisite below are now historical and resolved. Owner privately logged accountB in; actual A↔B/anonymous tests pass, both fixture rows intact. One real sampled-frame request HTTP200 returned zero destinations from synthetic non-travel frames. Owner final SQL: allocated0.15, remaining9.85, blockedfalse, requests3, settled3, unsettled0, known estimated usage0.01032150; trips present/RLS enabled/authenticated INSERT alltrue. Do not repeat keys, schema, grants, SQL probes, account creation or spend reset. Runtime flags restoredfalse. No further owner action is needed for these two tests. Positive recognition of licensed travel footage, broader UI acceptance and any Phase3/release remain separate work; no approval implied.

## 1. QA aggregate ledger SELECT permission

Actual authenticated Worker read returned upstream403 with PostgreSQL permission-denied classification, before reserve. Owner said they would run supabase/meta-video-budget-service-read.sql; no successful after-state yet. This script grants SELECT on aggregate meta_video_test_budget to service_role only and verifies anon/authenticated remaindenied. Review/execute only onQA aytrcvfncsklhqozreyk. Send the threebooleans, never key/filecontents. Agent can then use read-only QAUI to verify runtime; do not repeat a mutating probe until read succeeds.

AGENTS.md requires owner handling security-sensitive access changes; agent prepared source but did not execute grantSQL. Do not rotate key to fix a proven permission category without other evidence.

## 2. Independent-session lock test

Original B resultfalse is recorded as failed/inconclusive, notPASS. Scripts now include an active-session marker. Run whole meta-video-concurrency-a.sql in one SQLsession; during20s sleep immediately run whole meta-video-concurrency-b.sql in another independent session/window. Both B booleans must betrue. If active-sessionfalse, test did not overlap independent sessions; do not claim locking failure/success. Scripts rollback temporary writes; do not manually reset allocation. Recheck ledger matches its actual prior value.

## 3. Trips schema and two QA accounts

Second account not yet created (ownerconfirmed). Owner creates/logs into a second disposable account privately in an independent browsercontext. No passwords/OTP/token through chat. Run read-only supabase/meta-qa-trips-verify.sql to inspectQA schema; if missing, review/apply existing supabase/schema.sql inQA. Do not alter production or weakenRLS. Then actual A/B/guest Save/read/update/delete isolation can be verified.

## 4. After gates

Owner-approved Phase2C permits one small synthetic inference within existing cumulativeUSD10; no new spending permission implied. Keep flagsfalse until gatespass. Verify token-count/account behavior, actual usage/settlement, then frame and fullreview/draft/savechain. No automatic retry afteruncertainfailure. No billing/credit/privacysettings or secret changes are required by this report.

No new Meta key/project/production setup needed. No booking/payment, deployment, commit orpush authorized. Phase3 requires separateownerapproval afterremainingPhase2Cacceptance.

## Latest owner actions — resolved gates supersede sections1–2 above
HTTP403 fixed byowner-applied service_roleSELECT; actualWorkerread/reserve/settlePASS. RevisedBv2ownerreportsbothtrue; postprobeallocationunchanged. Do NOT repeatgrant/concurrencyprobes orkeysetup. ActualtextMetaHTTP200/usageverified; ownerSQLrequests2/settled2/unsettled0/allocation0.10/remaining9.90/blockedfalse. Ownerinstalledexistingschema.sqlaftermetadatafoundtripsmissing; actualSave/fullreload/Mytripsfetch/reopenPASS, preservingedited10:01/hemat/budget/prompt. Do NOT rerunCREATE TABLE schema.

Remainingowner-only prerequisite: seconddisposableQAaccount andindependentnormalbrowserloginfornegativeRLSverification. ExistingaccountAtripissyntheticandmustbepreserved. No password/OTP/tokeninchat. Nativeframeanalysisandcross-accountRLSstillpending; Phase2C PARTIAL andPhase3NOTREADY. Inferenceflagsrestoredfalseafteroneauthorizedtextrequest; noretry/paidframecallperformed.
