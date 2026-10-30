# API cost report

27 Oct 2026; start/end HEAD `737fbc5636145fc27a0bf4ac41be831835dfbd44`.

**Actual Meta requests: 0. Actual Meta spending by this work: USD $0.00. Authorized maximum: $5, not a target.** No other paid provider calls, media uploads, storage provisioning or deployments were made. Owner reports $150 hackathon credits active; account access/credit balance were not independently verified. Test costs in mocked responses are synthetic arithmetic, not charges.

Published Standard Spark rates checked 27 Oct: input $1.25/output $4.25 per million tokens ([official pricing](https://dev.meta.ai/docs/pricing-rate-limits)). Adapter bounds transcript at 12,000 UTF-8 bytes, small fixed instruction/schema and output at 2,000 tokens. Planning upper allocation: 20,000 input and 2,000 output tokens → $0.0335. Reserve **$0.05 per attempt**; at most 100 allocations globally under a $5 SQL budget. Before activation, verify the actual model/tokenizer/input-overhead upper bound, account billing mode and current rates; this is a conservative design estimate, not measured inference cost or a provider-enforced account cap.

`supabase/meta-video-budget.sql` uses a single locked budget row. No replenishment/reset/refund function, no KV race-prone counter. Entire allowance remains allocated after timeout/unknown billing/failed settlement. Actual usage can be recorded separately; absent usage is never treated as free. No automatic retry/fallback/ASR/search/image request. Existing platform AI quota is not silently consumed by this separate endpoint.

Hard-cap status: source implemented, **not deployed or operationally verified**. Therefore no paid call was attempted. Billing alerts and credits are not cap evidence. Owner must approve/apply the nonproduction migration and verify concurrent isolation/caps, or supply a reviewed alternative enforceable cap; then separately perform an authorized bounded fixture test. Do not enable flags just because credits exist. Whole-account spending from other consumers remains outside this adapter's control.

## Phase2B supplement
Actual Meta spend remains USD0; zero paid/live API requests. Added mandatory input_tokens preflight for both transcript/frame inputs; frame data URI uses input_image, not Files API. Both count and inference are behind nonproduction/budget gates. Source SQL now includes per-user10attempt cap and anomaly halt; no migration applied. Allocation remains USD0.05; token bound20k+2k gives planned inference maximumUSD0.0335 at documented Standard rates. Account cost/entitlement, billing treatment of count endpoint and actual SQL concurrency must be verified before activation. Safe accounting logs contain numeric usage/allocation only. See BUDGET_CONTROL_TESTS.md.
