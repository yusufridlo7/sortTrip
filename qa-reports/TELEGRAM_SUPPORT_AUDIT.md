# Telegram support and task-agent audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Separation verified in source/contracts

Internal task bot: allowlisted owner commands, queue validation/cancel/resume boundaries, temporary-queue tests. Actual autonomous Desktop bridge remains unverified; no real task queue/secret file read or modified. Natural-language tasks are not shell authorization.

Customer support: separate webhook secret/bot/admin chat, validated text ticket creation, persistence, polling, admin reply/status close, outbox retries/rate limits/deduplication, recognizable credential/card rejection. Customer messages never execute internal developer commands. English admin footer corrected. Production support/config enabledtrue; localfalse. These are configuration flags, not live connectivity or conversation proof.

No customer/admin message was sent. Controlled create→notify→reply→user poll→close is OWNER_ACTION_REQUIRED. Text two-way code exists, so it is PARTIAL rather than “one-way only” or “fully working”.

## Missing support extensions and implementation plan

Complaint category selector, screenshot upload and explicitreopen control not found. Add validated category enum (hotel,flight,transport,payment,Trip Pass,Price Watch,AI,account,refund,technical,feedback) to frontend/API/DB with backwards-compatible general default; never treat customer text as code. For attachments, first define size/type quotas, malware/content checks,private storage, RLS and expiring owner-only access; never forward arbitrary URLs or credentials. Reopen must enforce ticket ownership, rate limits and audit history. Migration/retention/security design must be reviewed before connecting real customers.
