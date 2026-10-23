# Owner-controlled acceptance actions

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

| ID | Required verification | Exact blocker |
| --- | --- | --- |
| E2E-NUITEE-FINANCIAL | Payment SDK authorization/3DS, supplier Book, recovery, cancellation, refund and payout | No real charges/bookings authorized; account liability support LAS-3185 unanswered. Native SDK form rendering is historical owner evidence, not this E2E. |
| E2E-MIDTRANS-SANDBOX | Isolated sandbox Snap checkout, webhook reconciliation and pass activation | Current deployment is not an isolated sandbox. Owner provisions controlled sandbox configuration and test account without changing production. |
| E2E-PRICE-WATCH-DELIVERY | Scheduled watch claims, lower fare, in-app alert and controlled email delivery | No controlled recipient/watch available; running production scheduler manually could contact real users. Existing last-check timestamp alone does not establish delivery. |
| E2E-SUPPORT-TWOWAY | Controlled complaint, Telegram admin reply, history and close | Local support disabled; production config enabled. No permission to send customer/admin test messages; owner designates controlled recipient. |
| E2E-AUTH-RLS | Signup/verification/refresh and two-user database isolation | Existing owner session only. Need two disposable QA accounts and non-production records; no login/OTP/email dispatch performed. |
| E2E-MIGRATIONS | Verify deployed RLS, RPC grants and migration order | Source SQL inspected; no privileged DB attestation or migration applied. Historical Price Watch migration and latest account-scoped entitlement must not be applied in the wrong order. |
| E2E-BACKUP | Restore a database backup in an isolated environment | No owner-approved backup/restore environment; destructive production tests excluded. |
| LEGAL-WORDING | Review privacy deletion claim and native SDK wording | Whole-trip deletion was not found; general partner-site booking wording and the Google external-service phrase need review without changing legal meaning automatically. |
| E2E-ATTRIBUTION | Confirm affiliate commission attribution and settlement | Tracked links verified in source/contracts; actual conversion/payout requires controlled partner-side evidence. |
| E2E-GOOGLE-CONSOLE | Account-wide Routes SKU quotas and billing usage | Application counters work; Google Console quotas and other clients sharing the billing project are not attested. Application caps are not an unconditional zero-cost guarantee. |

## Priorities

1. Prepare an isolated Midtrans sandbox and disposable users; verify settlement, entitlement and two-user RLS before unrestricted paid launch.
2. Observe a controlled scheduled Price Watch alert and a controlled Telegram support round trip before promising delivery.
3. Review privacy wording. Deploy local fixes only after explicit release authorization, then repeat the production smoke checks.
4. Verify backup/restore, remote Cron, migration order, billing-project quotas and affiliate attribution where relevant.

No API keys, passwords, OTPs or card details are needed in chat. Do not repeat Nuitée registration, publication of the existing 5% margin or Google activation. White-label LAS-3147 is archival and is not a launch gate. LAS-3185 remains a separate commercial question about the account card; no substantive answer is present in the supplied evidence.

Legal review is also required for the privacy deletion claim, native SDK wording and ambiguous Google external-service phrase. The engineering audit can close with these explicit boundaries. Payments and notification delivery cannot be marked PASS without the missing evidence.
