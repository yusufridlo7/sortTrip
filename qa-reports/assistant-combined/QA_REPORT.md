# Combined travel request and attachment

27 October 2026. Local, uncommitted on codex/meta-hackathon-phase-2-2026. No deploy, credential/env read or change, paid API request, booking/payment, customer message or database save. Starting/ending HEAD remains 737fbc5636145fc27a0bf4ac41be831835dfbd44. This supersedes the prior mutually exclusive source-editor behavior described in assistant-unified/QA_REPORT.md.

## Behavior

The travel request is always visible. The selector now chooses an **optional attachment type**, not an alternate Assistant feature. Budget, pace and transport preferences remain available beside the caption. Link, MP4 and transcript fields coexist with it. Only real work temporarily disables inputs. Privacy information is collapsible and upload/transcript consent explicitly includes the travel request when sharing with Meta.

Transcript extraction sends sourceTranscript and travelerRequest as separate data in one server-side Meta request. Only sourceTranscript can substantiate quoted source evidence. The caption must not be falsely reported as observed video content. Caption has a 1,000-character/3,000 UTF-8 byte cap, with the existing streamed total JSON body cap unchanged. MP4 uploads use bounded multipart data for file plus caption; structural validation still stops with MEDIA_PROCESSOR_REQUIRED, processed:false and retained:false. No video forwarding or fake analysis added.

After destination review, the combined action in an existing itinerary calls its normal planner with both the original caption and sanitized mediaDestinations, plus the same dates, group, budget, pace, routing context and protected items. No second corrective prompt is required to attach the preferences. The ordinary authenticated AI quota, source grounding, hotel-budget intent, quote enrichment and paid/pending/lock safeguards remain. At most one successful existing AI result is charged per normal planning run; Meta extraction is a separate bounded service stage, not an extra Trip Pass result. No automatic provider fallback on failed extraction.

Explore's explicit reviewed-media planning action creates a separate compatible initial draft using selected travel parameters, then requests the existing planner once. It does not pretend to have selected or purchased a flight. Missing flights/prices stay unresolved. This automatic initial request is gated by a dedicated onMediaChoose action, never by the mere presence of old metadata on a saved trip or partner selection. Existing drafts retain their normal confirmation. The native-video/live Meta limitations remain, so this real model chain was not exercised.

Only small reviewed place metadata is retained with a saved itinerary; no transcript/video/raw provider response. Identity is resolved again against the existing catalog, deduplicating exact aliases by canonical source URL. Unknown identities cannot self-assert verified status or coordinates. A separate control removes retained attachment-place context. The combined flow uses parent travel settings; redundant child date/traveller fields are hidden to avoid controls that would be ignored. The original media review requirements remain.

## Verification

- **384 unit/mocked integration tests pass, 0 failed/skipped**. New cases cover caption plus hotel-budget/KLIA intent and numeric preferences reaching the same planner context; protected IDs/locks carried; minimal metadata and canonical deduplication; oversized-caption rejection before cost reservation; Meta caption/evidence separation; multipart file+caption with consent and size safeguards.
- Typecheck and production build pass; inherited >500kB bundle warning remains.
- ID/EN scan: **1,583 keys, no errors or untranslated JSX literals**. User-written Indonesian caption intentionally remains unchanged when selecting English.
- Real localhost browser, itinerary: caption and URL simultaneously visible/enabled, budget/pace controls present, inaccessible-link fallback retains caption, transcript and upload choices retain the same caption. No real extraction or planner request submitted.
- Real localhost browser, Explore: caption plus optional link simultaneously visible. Standard no-attachment search remains available. No flight query submitted.
- Mobile 390×844 and desktop1440×1000, ID/EN: initial upload consent inherited width100% from normal AI inputs and caused documentWidth436. Fixed checkbox to18px with a wrapping text span; fresh measurement documentWidth375 ≤ viewport390 and zero Assistant overflow elements. Screenshots desktop-id.png and mobile-en.png.
- QA captions were cleared from the disposable local draft/editor afterward. No Save, payment, upload or real model action pressed. Existing account/RLS persistence and live two-provider chain are NOT newly verified.

## Limitations and boundaries

Meta paid usage **USD0**. Source-only hard-cap SQL, account/credential entitlement, native media inspection/ASR/deletion and live save gates from Phase2 remain unresolved. URL recognition is not access to its video. Inaccessible media does not silently fall back to a billable text-only plan. The explicit source review remains before a real plan; the improvement combines the input request, not a claim of zero-review/autonomous agent execution. This is ordinary initial planning integration, not Phase3 autonomous replanning or Phase4 optimization.

Changed source: app/assistant-source-picker.tsx, video-itinerary.tsx/.css, ai-planner.tsx, flight-search.tsx, travel-app.tsx, travel-data.ts, i18n/locales/video.json; lib/assistant-media.mjs/.d.mts; worker/video-itinerary.js, itinerary.js, ai-draft.js; targeted checks and project memory. No provider configuration, migrations or dependency manifests changed.

### Optional attachment help — 2026-10-27
Added ID/EN exclamation help using native details/summary with an associated select label. Targeted UI tests: 3 passed; i18n1587 keys passes; build passes with existing bundle-size warning. Fresh local browser verifies ID/EN copy and Enter open/close. Mobile390px: document375px, no horizontal overflow. Proof: attachment-help-id.png. No paid/provider request or deploy.


### Global information panels — 2026-10-27
Supersedes the inline attachment-help disclosure above. All shared InfoNote icons now open a Radix modal panel; the standalone Trip Pass exclamation uses it too. Existing informational content and purchase terms retained. No form expansion. Escape, close button and outside click verified in local browser; focus returns to trigger and Tab stays inside modal. Attachment/date/Assistant/coverage panels verified; ID/EN verified. Mobile390px: panel358px, document390px, no overflow. Proof: info-panel-mobile-id.png. 25 targeted UI/payment tests pass (info-panels-tests.log), i18n1587 pass, typecheck/build pass (info-panels-build.log; existing large-bundle warning). Trip Pass status refresh/PriceWatch live controls not operated. No provider call, payment, commit/push or deploy.
