# Trip Pass Rp30.000 — prepared locally, 2026-10-12

Owner requested raising the price to Rp30.000 while deferring browser-workflow optimization. Branch `codex/trip-pass-30000` preserves the existing working tree.

- New orders: Rp30.000, 10 successful AI results, 30-day validity. Current AI/browser workflow unchanged.
- Existing purchased passes retain their stored limits, usage and expiry.
- Existing Rp15.000 invoices are not repriced. Verification compares provider gross amount with the stored order amount, supporting both old/new denominations; a Rp15.000 payment cannot fulfill a Rp30.000 order.
- Pending-checkout link displays stored invoice amount where available, rather than advertising the new price on an old invoice. Reuse of existing pending checkout is retained.
- ID/EN purchase buttons, exhausted-quota copy and FAQ updated. No secrets/payment-provider configuration changed; no real payment, production migration, commit, push or deployment performed in this change.

## Required rollout order

1. Owner reviews/applies `supabase/trip-pass-price-30000.sql` in the existing project. It replaces the known amount CHECK constraint to accept both 15000 and 30000, without updating/deleting orders or passes and without changing RLS/entitlement RPCs. Supabase may warn about DROP CONSTRAINT; this concerns the price constraint, not table deletion.
2. After successful migration, deploy reviewed frontend/Worker together using existing browser-enabled configuration/keep-vars. Current production remains Rp15.000 until that deployment. Price change is not effective merely by applying SQL.
3. Owner verifies a new Rp30.000 checkout and any legacy pending invoice; real billing actions stay owner-controlled. Legacy purchased-pass allowance remains unchanged.

Financial assessment: Rp30.000 provides Rp3.000 gross per successful result if all ten are used, giving more room than Rp15.000. Profitability is unverified until total provider/tool/browser/retry/payment/infrastructure/support costs are measured. Do not promise profitability or verified live supplier prices. Existing Trip.com/12Go access blockers are independent.

Tests: 185 automated tests pass, including new/legacy stored-amount matching, signed production webhook fixture for both prices, underpayment refusal and new checkout amount. No live purchase made. Frontend build verified separately; deployment blocked on owner migration application.
