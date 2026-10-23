# Price Watch audit

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Verdict: PARTIAL — not certified working end to end

Flight watch linked to saved itinerary, baseline then new-low comparison, own-account in-app notifications and optional verified-user Resend email. Hourly source Cron, claim batch 5, leases, eligibility/date expiry and email idempotency; support outbox every 2 minutes does not run flights. SQL supports 2–14-day trips. No hotel monitoring, arbitrary threshold, full price-history chart, increase alerts or Telegram price alerts found.

Browser existing watch displayed “Last checked:23/10/2026,05:00:28” and “No fare data yet”; notifications empty. This is persisted state, not a witnessed scheduled job/receipt. No watch created/stopped and no real email sent. Remote currentCron/applied SQL remain unverified.

## Fixed / exercised

Legacy scope international now normalized to all for exact domestic routes. One DB finish error no longer abandons later claims. Email network failure defers one notice while continuing others, preserving Idempotency-Key. Tests cover claimed route/fare shape, no-price behavior, multi-watch isolation, synthetic drop-notice email content and duplicates; SQL source reviews comparison/expiration/RLS. Full scheduled→provider→DB→alert→receipt is OWNER_ACTION_REQUIRED.

## Controlled acceptance procedure

1. Owner designates a disposable watch, active pass and test email.
2. Verify remote hourly trigger and effective account-scoped RPC grants; do not reapply historical SQL blindly.
3. Witness one due baseline with exact route/date and last_checked; inject an isolated synthetic lower fare in a test deployment.
4. Assert exactly one own-account notification and one controlled email with the correct IDR amount/date/link; unchanged/increase/unavailable/timeout must not fabricate drops.
5. Replay/retry to establish dedupe; expire pass/date and prove no further processing; clean only designated disposable data.

Until that evidence exists, do not market reliable alert delivery as verified.
