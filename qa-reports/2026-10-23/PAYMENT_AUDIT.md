# Payment audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Midtrans

Backend contracts test auth/origin,amount/signature reconciliation,idempotency/duplicates,pending/failure/expiration/cancel behavior,server-side status and entitlement activation. Wrong-signature/origin/unauthenticated production/local probes reject with403/401. Frontend redirect is not proof of settlement. No real production charge and no current isolated sandbox Snap transaction executed.

## Nuitée SDK

Separate financial product from Trip Pass. Native room/session/change-of-terms/final amount/consent/status/recovery contracts pass. Current local history503 handled in readable English; full checkout shell ID/EN sampled seven widths. Historical owner SDK form rendered with Indonesia; this does not verify authorization/3DS, Book or refund. Owner payment tab was not operated and no guest data/terms/real card were submitted.

## Required controlled validation

Owner provisions sandbox configuration outside production and disposable payment user; exercise pending → success/failure/expired/cancel, duplicate submission/webhook, reconciliation and pass entitlement. For supplier checkout, owner operates any consequential payment/terms; verify confirmed booking reference and uncertain-state recovery before marking live-ready. Check LAS-3185 liability and payout terms separately. No approval flag or financial config was changed during QA.
