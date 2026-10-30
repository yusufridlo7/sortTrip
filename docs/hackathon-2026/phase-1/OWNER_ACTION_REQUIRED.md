# Owner actions and Phase 2 gate

27 October 2026. **PHASE 1: COMPLETE. PHASE 2: NOT READY for live implementation/testing until explicit approval and the critical prerequisites below.** No login or credential request was attempted. Independent audit work was completed rather than waiting on these items.

## Critical prerequisites

| ID | Owner action / evidence needed | Why it matters | Agent boundary |
|---|---|---|---|
| O01 | Confirm selected-participant acceptance, Startup track/team and original Official Rules/waiver access | Public event page is not proof SortTrip/team is accepted; application deadline has passed | No duplicate registration; owner logs in/completes OTP/CAPTCHA and accepts terms |
| O02 | Provide readable official rule requirements or non-sensitive confirmation covering pre-existing product reuse, new-work window, judging weights, demo length/language, repository/demo visibility and submission fields | Starting code is pre-event; event page confirms dates/theme, not all detailed rules. Organizer waiver only loaded a shell in research | Do not treat third-party guides or this audit as legal eligibility approval |
| O03 | Explicitly approve Phase 2 scope: consented original-upload MVP, URL→upload-required fallback, one city/short clip, no arbitrary downloader | The brief authorizes Phase 1 only | No adapter/upload/agent feature starts until approval |
| O04 | Confirm Meta team/account model access and credits/balance; identify enabled Spark/Voice models using non-sensitive evidence | Public catalog/docs ≠ entitlement or funded credits; no account was accessed | Owner installs server key privately only when needed; never paste key into chat; no agent credential read/rotation |
| O05 | Set an explicit maximum spend for a nonproduction live model experiment and daily/global limits; confirm Standard data mode | Phase 1 forbids paid calls; hackathon credits are not assumed; Contributor has a training-use tradeoff | No billing activation, paid fallback or model inference now; permission to code is not spending permission |
| O06 | Supply/select an original or licensed short demo MP4 with permission for all visible/heard content and consent to provider processing | Social public visibility/embedding is not a general right to download/analyze/redistribute | Do not use other creators' video, private overlays or voices without permission |
| O07 | Approve privacy/retention choices and any nonproduction R2/job-store/queue/isolated processor resources and migrations | New untrusted media needs ownership, caps, cleanup and safe processing; current bindings lack a media store | Proposed24h raw retention is not an applied policy. Resource/account/migration actions remain separately gated |

## Existing-product/security follow-up

| ID | Action | Evidence / scope |
|---|---|---|
| O08 | Authorize a compatible Wrangler/Miniflare/Undici security maintenance change separately, or explicitly include it in the next phase | npm audit identifies1 high / 2 moderate affected packages; candidate Wrangler4.153.0. No automatic fix in Phase 1 |
| O09 | Review security-header/rate-limit/bounded-body plan | Homepage header gaps, public-flight limiter gap and existing buffer-after-read patterns. Preserve third-party payment/widget compatibility; no production settings changed |
| O10 | Provide sanitized migration/policy status or authorize nonproduction two-user RLS verification | Source policies exist; deployed policies and isolation are not freshly tested. No SQL/service secret needed in chat |
| O11 | Decide branch/tag handling and preserve dirty local work before implementation | Proposed branch `codex/meta-hackathon-2026`; baseline tag targets737fbc5636145fc27a0bf4ac41be831835dfbd44. Neither created/pushed |
| O12 | Review live financial/provider limitations separately | No new payment/Book/refund/payout/country-bypass/White-label setup is required for the hackathon MVP; old support/liability matters are not silently resolved |

## Readiness decision

Architecture and local baseline are sufficient to scope Phase 2. Live end-to-end readiness is **NOT READY**: approval, acceptance/rules, model access/credits, allowed spend, licensed media and private-processing decisions are unresolved. Optional social connectors must stay disabled where permissions cannot be proven. Instagram primary docs429 and the dynamic organizer rules are research-access limitations, not a reason to scrape/bypass or stop all Phase 1 work.

The audit does not request that all seven later phases be approved together. Each phase, spending expansion, credential action, migration, release and final submission retains its own gate. No Phase 2 application code has been written and no commit/push/deploy is part of this task.

## Required approval question

**Phase 1 is complete. Do you approve proceeding to Phase 2 — Video-to-Itinerary AI?**

Waiting for explicit owner approval. Reports alone do not authorize implementation.
