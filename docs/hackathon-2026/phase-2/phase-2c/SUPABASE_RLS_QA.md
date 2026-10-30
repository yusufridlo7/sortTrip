# Supabase RLS QA

**Two-account negative tests VERIFIED LIVE, 27 October 2026; account-A Save/reload VERIFIED LIVE.** Owner created and logged in account B privately. A used 127.0.0.1:5174 and B localhost:5174, with separate browser-origin authentication storage. Project aytrcvfncsklhqozreyk only; no production customer accounts/data. No password, token or session value inspected.

Budget table RLS/service-only function privilege checks already owner-verified in Phase2B. They do not establish trips-table RLS. Source supabase/schema.sql uses auth.uid() ownership for trips SELECT/INSERT/UPDATE; no DELETE grant. That schema must not be weakened for QA.

Owner actual aggregate/schema query found trips absent (false/false/false); owner then applied existing supabase/schema.sql onQA and reportedSuccess. Agent normal UI Save and fresh database list/reopen after fullpage reload succeeded, including edited10:01/transporthemat. This proves own-account access; no claim that tablepresence or own-accountsuccess certifies isolation. Do not reapply CREATE TABLE schema now that it exists. A/B/guest negative tests remainpending.

Actual direct Supabase publishable-client tests used two disposable QA fixtures. Queries targeted the fixture ID without a client-side owner filter. The runner rejects same-account references and verifies a successful own-row read before cross-account attempts. No service-role client was used to certify isolation.

| Test | A | B |
|---|---|---|
| Own INSERT / UPDATE / independent SELECT | PASS | PASS |
| Anonymous SELECT of own fixture | Denied, PASS | Denied, PASS |
| SELECT other fixture by ID | Zero rows, PASS | Zero rows, PASS |
| UPDATE other fixture by ID | Zero rows, PASS | Zero rows, PASS |
| DELETE other fixture | Permission denied, PASS | Permission denied, PASS |
| INSERT with other account as owner | Permission denied, PASS | Permission denied, PASS |
| Owner fixture unchanged after all attempts | PASS | PASS |

DELETE is denied at table privilege level: the existing schema grants no DELETE to authenticated users. It is not evidence of a separate DELETE RLS policy. Expired-JWT, network and schema failures are not accepted as passes. No grants or policies were weakened.

One initial owner-integrity check falsely failed because PostgreSQL jsonb reordered nested object keys. Corrected the test comparator to canonicalize object keys while preserving array order and comparing all fields. Added regression coverage; repeated actual owner read passed. This was a test-harness defect, not observed unauthorized database access.

Evidence: evidence/rls-two-accounts-live.json (actual sanitized UI results, no account/row identifiers). A cropped screenshot was discarded because the browser capture used different viewport coordinates and did not show the result. Disposable fixtures remain in QA; the previously saved travel draft was not a mutation target. This verifies current QA trips isolation only, not production configuration or every future table.

Owner controls account creation/login/OTP and any SQL grant/schema changes under AGENTS.md. No such changes executed by agent.
