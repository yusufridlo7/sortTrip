# SortTrip — Next Actions

## Latest continuation — 2026-10-03

1. Continue from POST_QA_REPAIRS.md, do not redo completed QA. Owner verifies local Worker payment configuration (names only in report; never send values). Local status is503, production authenticated sandbox button is enabled.
2. After owner setup, verify active Trip Pass UI and server-confirmed payment return; actual checkout/payment remains owner-only. Do not enable production payments automatically.
3. New per-day settings, automatic lodging area, Beli tiket and 12Go links passed targeted browser checks and save/reload; build and84 tests passed. Finish fresh mobile verification when official viewport control applies correctly.
4. Preserve existing Travelpayouts/Aviasales API; affiliate attribution is not yet proven. Skip hotel partner work per owner.
5. No commit/push/deploy. Review changes and remaining live AI/payment/affiliate gates before requesting deployment approval.


## Latest QA next steps — 2026-10-02

Local repair and pending core browser regression now complete; do not repeat completed QA. Owner verifies AI provider quota/rate and local AI configuration for real generation regression. Verify affiliate script/domain configuration separately from working flight Data API; do not replace flight credentials. Review16 local repairs and QA_AUDIT.md; build and76 tests pass. Full production-ready remains unproven until live AI/external checks succeed. Deployment requires explicit approval; no commit/push/deploy. Earlier browser restoration instructions are superseded.


## QA continuation priority — 2026-10-02

1. Resume from [QA_AUDIT.md](QA_AUDIT.md), not from the start. Browser disconnected; restore official In-app Browser and finish only the Remaining Issues browser checklist on the existing QA trip. Never use personal-browser/profile workarounds.
2. Owner checks production AI provider quota/rate state and configures local AI if desired; do not send credentials. Local health AI=false; production live request previously provider429. After owner action, verify actual AI generation/edit/save/reload without mock output.
3. Review local repairs (build PASS,76 tests PASS) and keep production unchanged until remaining regression and explicit deployment approval. No commit/push/deploy authorized.
4. Keep partner blockers separate. Aviasales positive inventory now proven; no re-registration/token replacement needed. Await Viator support; Agoda/CJ/Booking approval still not established by QA.
5. Later readiness validation: partner tracking/checkout, RLS two-account testing, live price-watch/email and payment-owner handoff. Existing hotel/transport estimates must never be presented as live offers.


## Immediate
Viator support inquiry is now submitted through the official Affiliate API contact form (Thank you confirmation, 2026-10-01). Await response to owner's email before repeating credential replacement or sandbox tests; do not duplicate inquiry. Owner shares only non-sensitive support instructions.
Latest Viator update: Full Access is visible for sandbox and production, but fresh-runtime sandbox test after owner key replacement still returns HTTP 401. Owner verifies that `.dev.vars` has the currently enabled sandbox credential under `VIATOR_API_KEY`; do not send its value to the agent. Keep sandbox environment. Re-test after owner action; do not switch to production to bypass the failure.
Latest priority update (2026-10-01): Payoneer is under review according to owner; wait and do not restart signup. GetYourGuide inquiry successfully submitted (ticket 22305587); await response alongside Klook without duplicate inquiries. Owner login is required for existing Agoda application verification and tiket.com registration. No new affiliate account/API approval is established by these inquiries. This update supersedes earlier Payoneer signup instructions below.
0. Local Aviasales configuration restored: owner supplied existing token; stale Worker replaced. Direct and proxied health configured=true, test searches HTTP 200 (zero matching offers). Preserve this configuration; no new account needed. Payoneer signup remains owner-only; official page is open for takeover.
0. Latest blocker: actual Viator sandbox request returned HTTP 401 after owner setup. Owner verifies that the local credential belongs to sandbox and is enabled; do not change to production just to pass a test. CJ account already exists: stop duplicate onboarding; owner handles payout/bank/Payoneer steps, with the claimed payout restriction still independently unverified.
1. Viator: production Basic Access enabled is now verified from the owner's masked screenshot. Backend adapter is ready; owner enters a sandbox key in ignored `.dev.vars` using `VIATOR_SETUP.md`, then continue sandbox connection verification and UI work. Owner login to tiket.com's Google form and complete Booking.com CJ password/email steps separately.
2. Await Klook response to the submitted inquiry; avoid duplicate submissions. Use `PARTNER_OUTREACH.md` for verified routes and drafts.
3. Keep 12Go inquiry unsent while contact access permission is denied. Verify existing Agoda application before duplicate registration. Aviasales is already connected per owner and uses the Data API in code; preserve it and do not repeat onboarding.

## Earlier immediate items
1. Completed 2026-10-01: project-memory reading and update rules are incorporated into `AGENTS.md`. Keep this context current before meaningful SortTrip work.
2. Verify current Git working-tree state before any commit/push.
3. Verify actual partner statuses from dashboards rather than historical assumptions.

## Partner verification
### Viator (earlier verification history; latest action is above)
- Latest 2026-10-01: affiliate account verification and tools are confirmed. API inspection is blocked by the additional code-verification gate (`Send my code`). Owner must complete it manually, without sending any code/key to the agent or Telegram. After `/resume` and Desktop continuation, re-check the gate using only safe status/labels, then verify API entitlement/documentation without reading credential fields.
- Earlier 2026-10-01 CAPTCHA/login handoff was completed by owner and dashboard access was verified. Telegram alone still cannot wake the Desktop browser agent; `/resume` requires a Desktop state check.
- Open the existing Viator dashboard using the controlled Desktop browser.
- Verify account/affiliate/API status.
- Identify available credentials/integration method without exposing secrets.
- Update `PARTNERS.md`.
- Only then continue technical integration.

### Travelpayouts / Aviasales
- Existing connection confirmed by owner; retain existing Data API code and account. No new registration or rebuild.

### Agoda
- Determine whether an application was successfully submitted after the earlier form/approval issue.
- Update `PARTNERS.md`.

## Technical
- Re-check `/api/health`.
- Determine why AI and flight configuration were previously reported false, without exposing environment values.
- Verify AI itinerary end-to-end.
- Verify flight search end-to-end.
- Select/verify a viable hotel-data/affiliate path.
- Continue activity integration after Viator status is confirmed.

## Agent platform
- Keep Telegram as task/status notification channel.
- Do not claim arbitrary Telegram → Desktop browser automation is complete.
- If autonomous execution is expanded, preserve filesystem isolation and owner-only credential handling.

## Production gate
Before calling SortTrip production-ready, verify at minimum:
- live supplier data sources,
- affiliate tracking/deep links,
- partner approvals,
- secret configuration,
- error handling,
- local/production build tests,
- database security/RLS,
- production deployment,
- end-to-end booking handoff,
- monitoring/logging without secret leakage.


Latest payment update — 2026-10-03: Supabase payment-status blocker resolved after owner save/restart. Next owner action is local MIDTRANS_SERVER_KEY sandbox configuration and owner eligibility verification. Never request its value in chat.

Latest local payment gate: Midtrans key presence now recognized, but sandbox owner eligibility fails. Owner verifies OWNER_TEST_ENABLED=true and OWNER_USER_ID equals the logged-in Supabase user UUID, then restart/recheck. No key validity or transaction success claimed.

Latest payment status: local sandbox checkout button now enabled for logged-in owner. Configuration gates resolved. Next: owner manually tests sandbox checkout (not owner-test bypass), then agent verifies server-confirmed pass status. No actual provider checkout/settlement verified yet.

Latest checkout repair: status refresh/rate-limit UI lock fixed, error retained and checkout link fallback added. Owner retries sandbox checkout once; report safe error text only if unsuccessful. No repeated credential changes without evidence.

Latest: recovered existing sandbox checkout link visible as Buka halaman pembayaran. Owner continues that existing order; do not create another or change credentials. Wait for owner simulation result and then verify entitlement.15 payment tests/build PASS.

Single fixed-label Beli Trip Pass control verified in fresh local tab; owner uses it to continue existing sandbox checkout. Refresh stale tabs after saving drafts if old controls remain. No deploy.

Transport widget: resolve vendor legacy-jQuery sandbox incompatibility via dedicated separate-origin hosting or official isolated embed. Do not enable same-origin third-party script access to SortTrip auth storage. Re-test autocomplete, date and affiliate tracking before declaring complete. Current fallback uses z=17068680.

Transport update supersedes previous separate-host requirement: opaque data-document widget now initializes and route/date click-out works locally. Horizontal layout per owner. Before production approval, verify mobile layout and dashboard affiliate attribution; no commission guarantee. No generic partner search fallback needed. No deploy authorized.
