# Implementation roadmap — approval-gated

27 October 2026. **Nothing below has been implemented by Phase 1.** Estimated work allocation, not a guarantee of delivery/eligibility. Product scope stays one city and a short permitted video before expanding coverage. Preserve the existing production provider, saved trips, partner integrations, quotas and purchased items.

## Planning assumptions and judging evidence

Use owner brief weights for planning: Impact30%, Meta AI Tooling25%, Technical Depth20%, Demo25%. Exact official weights, use of existing products and submission requirements await a readable organizer rules/acceptance record. Meta's public event page confirms a submission cutoff of4 November21:00ET (=5 November09:00WIB), subject to changes. Target an internal freeze on3 November and submit by4 November20:00WIB to leave margin; this is a recommendation, not an automation/reminder.

Evidence of impact: show the same novice travel task before/after, measure time-to-usable-plan and number of corrections on a small disclosed test set. Evidence of Meta tooling: actual model/version and sanitized tool/usage trace, not a logo or renamed OpenAI call. Technical depth: ambiguity handling, source-backed places/quotes, bounded tool loops and locks. Demo: reproducible3minute story with a labeled cached fallback, no fabricated live results.

## Phase 2 — Video-to-Itinerary AI

**Scope:** gated video entry UI, authorized short-upload path, truthful URL/upload-required states, timestamped Meta extraction, candidate review, verified-place mapping and draft preview. One-city MVP; no arbitrary social downloading, automatic payment or global-place guarantee.

**Proposed files:** new `app/video-itinerary.tsx`, `app/video-itinerary.css`, `app/video-itinerary-types.ts`; new `worker/meta-provider.js`, `worker/media-policy.mjs`, `worker/media-jobs.js`, `worker/video-extraction.js`, `worker/place-resolution.js`; integration points `app/travel-app.tsx`, `app/travel-data.ts`, `app/apply-ai-plan.ts`, `worker/index.js`, `worker/itinerary.js`, `app/i18n/locales/id.json`, `en.json`. Isolate reusable plan validation in a provider-neutral module only as needed. Proposed `supabase/media-jobs.sql`; private storage/queue bindings only after resource approval. Proposed tests `checks/meta-provider.test.mjs`, `media-policy.test.mjs`, `video-extraction.test.mjs`, `media-jobs.test.mjs`, `place-resolution.test.mjs`.

**Dependencies/API:** existing React/fetch/crypto suffice for adapters; no model SDK required initially. Private media storage, owner-controlled Meta key/team entitlement/credits, permitted fixture and trusted format inspection are dependencies. Browser frame extraction and a separately sandboxed inspector/transcoder are alternatives to native video; do not assume Node compatibility provides FFmpeg/GPU in Workers. Muse Spark1.3 plus text/transcript or Voice Transcribe is the primary proposed route; benchmark Spark1.2 if audio integration is simpler and still permitted/available.

**Security:** streaming byte caps, authentication/RLS, exact URL allowlist, no fetch bypass, signed private storage, metadata stripping and remote-file deletion; feature flag off by default. No secrets/media content in logs.

**Acceptance:** owner-approved original clip produces timestamped candidates; unresolved places remain selectable/unknown; duplicate IDs collapse correctly without merging different cities; candidate preview applies through existing validators; no missing hotel silently deletes existing lodging; cancel/failure preserves trip/quota; existing app paths pass regression. Prove provider error/retry behavior with fixtures before one bounded live trial. Account live access must be verified separately before declaring end-to-end readiness.

**Required tests:** invalid/private/redirect/encoded-host URLs, expired/wrong-user uploads, oversized/chunked/malformed containers, same-name cities, no landmarks, conflicting narration, prompt injection, schema refusal/truncation/429/401/402/5xx/cancel, duplicate jobs, deletion retry, audio missing/unsupported, ID/EN/mobile. Rights-cleared visual/video test set with known place identities; report observed precision/recall instead of cherry-picking a single success.

**Owner gates:** explicit Phase 2 approval, acceptance/full rules and existing-code eligibility, licensed media/consent, server credential handling, approved spending ceiling, storage/processor resources and privacy/retention. New schema/resources require reviewed owner action. No production rollout implied.

## Phase 3 — Agentic planning

**Scope:** bounded plan→tool→verify→revise loop, read-only typed travel tools, progress trace, two meaningful alternatives, explicit apply/save. Add a future `worker/travel-agent.js`, `worker/travel-tools.js`, `worker/agent-run-policy.mjs`; update `app/ai-planner.tsx`, `worker/itinerary.js`, `worker/itinerary-stream.js`, `app/apply-ai-plan.ts`, existing quote/route adapters. Add `checks/travel-agent.test.mjs`, `agent-tools.test.mjs`.

**Dependencies/API:** Phase 2 extraction/verified places and Meta tool-calling adapter; approved read-only provider quotas. Reuse current flight/hotel/Viator/Google/local routing functions with source/date/occupancy semantics. Default public-transport price can stay unknown; do not invent an API for12Go.

**Security:** validate tool name/arguments/results, owner/run/revision boundaries, global/user spend reservations, cancellation and max iterations. No generic network/shell/SQL or booking/payment/Telegram tools. Server enforces paid/pending/explicit-lock protections, not model instructions alone.

**Acceptance/tests:** at least one run needs multiple different tools and responds to their results; an over-budget/unavailable option triggers a justified alternative; a user locks a destination then revises and the lock survives; stale revisions and duplicate settlement fail safely. Test injection in each tool result, tool timeout/refusal, no evidence, budget exhaustion, conflicting constraints and deterministic final validation. Capture actual sanitized tool trace after approval; mocks alone cannot establish agentic performance.

**Owner gates:** separate Phase3 approval and any additional live provider/budget use; no automatic production enablement.

## Phase 4 — Budget optimization

**Scope:** deterministic cost model with known/reference/unknown components; total/per-person/per-room/per-night distinctions, entire-stay hotel amounts, group occupancy, feasible budget alternatives. Proposed `worker/budget-optimizer.mjs`, `app/budget-alternatives.tsx`, tests `checks/budget-optimizer.test.mjs`; reuse `app/itinerary-price.tsx`, `travel-data.ts`, `apply-price-quotes.ts`, `worker/lite-hotel.js`, `hotel-discovery.js`, `recommendation-budgets.js`.

**Dependencies/API:** validated comparable quotes with same dates/guests/currency/policies; limited supplier access already approved for search. No new paid price-index endpoint or exchange service assumed. Statistical estimates need observed samples; do not claim annual mean/deviation from a small seed.

**Security/acceptance:** model cannot manufacture a cheaper price, convert currency silently or change purchased/locked items. If no option fits, show the cheapest verified feasible alternative and shortfall; preserve an explicit user's strict cap when searching unless user changes it. Both room capacity and number of travelers affect totals; manual overrides must be explicit and provider-compatible.

**Tests:**1/2/3/8travelers,1/2rooms,0/1/multiple nights, bundled/one-way/return transport, tax/policy mismatch, missing fare, zero genuinely-free admission, stale quote, partial group availability, no under-cap hotel. Property tests/invariants for sums and nonnegative totals; compare two hand-computed fixtures. No booking test needed.

**Owner gates:** Phase4 approval; any live quote/FX/statistics cost expansion separately authorized.

## Phase 5 — Explainable recommendations and multimodal UX

**Scope:** source and timestamp panels, uncertainty badges, concise why/why-not alternatives, accessible media preview/captions and localized explanations. Proposed `app/itinerary-evidence.tsx`, `app/video-candidate-review.tsx`, `worker/recommendation-explanation.js`; update `app/ai-item-details.tsx`, `item-booking.tsx`, `route-map.tsx`, locales and privacy/help copy. Tests `checks/itinerary-evidence.test.mjs`, explanation-schema fixtures.

**Dependencies/API:** evidence captured in earlier phases; Spark for explanations only within existing budget; SAM/Image/Wonder remain optional unless a validated UX need justifies time/cost. Never create destination imagery that appears to be footage evidence. Never expose chain-of-thought as rationale.

**Security/acceptance/tests:** sanitize hostile captions/source titles/URLs; show source-supported facts versus estimates and unknowns; keyboard/focus/screen-reader/mobile and ID/EN checks. Every quoted price/identity has appropriate evidence or an explicit unknown/reference label. A reviewer can trace a stop to a timestamp and verified identity without seeing private media of another user.

**Owner gates:** Phase5 approval; privacy/consent/copyright wording review; separate approval for added models/costs. Keep legal/payment/cancellation meanings intact.

## Phase 6 — End-to-end QA and demo preparation

**Scope:** freeze test dataset and implementation SHA, full regressions/build/lint if added, adversarial media/SSRF/auth isolation tests, bounded approved Meta smoke, responsive ID/EN testing and3minute demo. Add `checks/video-itinerary-e2e.test.mjs`/fixtures, `docs/hackathon-2026/phase-6/*`, a dedicated nonproduction Wrangler config and demo script. No secret-bearing recorded dashboards or customer data.

**Acceptance:** complete owned clip→actual Meta→verified places→editable preview→budget revision→explicit save/reopen. Locks/purchases survive. Publish actual latency/cost and correctness sample counts, failure handling, limits and baseline/new-work diff. Fresh clean-install CI and dependency advisory remediation review. Malformed input cannot cause egress to private addresses, cross-user reads, unlimited jobs or automatic financial action. Restore existing app tests after errors. A recording that uses cached input/output must be visibly disclosed.

**Required tests:** full suite plus owned media fixtures; two test users; network denial/429/cancellation; stale trip; concurrent runs; worker memory/byte/duration bounds; cleanup; supported browsers/device widths; demo reproducibility. Financial flows stop before payment; no real bookings/customer messages. Backup plain upload/transcript flow and a labeled deterministic replay.

**Owner gates:** Phase6 approval, test-account login/OTP/CAPTCHA, bounded inference/provider spend, nonproduction resource/migration setup; production deployment requires its own explicit permission.

## Phase 7 — Submission

**Scope/files:** finalized `docs/hackathon-2026/submission/README.md`, `BASELINE_VS_NEW.md`, `DEMO_SCRIPT.md`, `MODEL_USAGE.md`, limitations/rights/license list, repository/working-demo links and video matching actual portal requirements. Submission draft is reviewed before any final publish action.

**Dependencies:** owner acceptance/Official Rules, team/track eligibility, approved final SHA/environment, access instructions that do not disclose credentials, clear rights to all demo media and original/new work evidence.

**Acceptance/tests:** portal fields/actual video length/language/working demo checked against current rules; links accessible; no secrets/customer identifiers; baseline before event explicitly disclosed; no invented benchmarks, model use, partner approval or credits. All materials and deadline conversion rechecked before final submission.

**Owner gates:** owner performs required login/verification, accepts legal terms and approves final submission/publication. Do not submit or contact organizers from a general implementation approval. Do not reuse old commit/deploy authorization for this hackathon.

## Suggested sequence after gates

Oct 27–28: owner decisions, approved Phase 2 fixture/adapter/security path. Oct29: candidate review and verified draft. Oct30–31: bounded tools, budget invariants and explanations. Nov1–2: end-to-end/adversarial tests and backup demo. Nov3: freeze and record. Nov4: final owner review and early submission. Re-scope immediately if model access/media rights are unavailable: an honest upload+verified itinerary MVP is preferable to an unauthorized downloader or a generic chatbot.
