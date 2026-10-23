# Trip Pass audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Actual product specification

New purchases: IDR 30,000 / 30 days / 10 successful AI results shared account-wide across trips. Legacy 20-result rights and older invoices retain original conditions. This supersedes the master checklist's hypothetical one-trip entitlement; do not reintroduce per-trip limits. Failed generation should not consume results. Expiry/exhaustion permit appropriate repurchase; manual editing remains available.

Fixtures cover access, quota, payment lifecycle,legacy preservation and unauthorized use. Existing owner UI reported 10 results and reload preservedsession; no entitlement grant/reset/purchase performed. Read-only access/status requests now carry language and checkout fallback translates. Live failed/exhausted/expired states remain synthetic; current sandbox settlement/activation and deployed migration/ownership must be verified in controlled accounts. Price Watch eligibility follows valid pass, not proof of a delivered alert.
