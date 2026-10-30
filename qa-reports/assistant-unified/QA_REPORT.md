# Unified SortTrip Assistant input

27 October 2026. Owner requested a single Assistant instead of an additional video panel. Local only on codex/meta-hackathon-phase-2-2026; no commit, push, deployment, model/provider call, booking/payment, credential change or database write.

## Change

Removed standalone Video-to-Itinerary panel. Existing Explore search Assistant and itinerary Assistant now expose one localized source selector: travel request, video link, upload, transcript. Only the selected input is visible. In itinerary view, normal AI controls/conversation are hidden while using media input, avoiding two sets of actions at once. Direct flight search retains its existing behavior. Normal text drafts remain when switching source. Processing/privacy detail is collapsed but consent remains visible for upload/transcript.

Reused authenticated extraction/upload backend unchanged. Media review creates a separate draft as before; it does not gain authority to overwrite purchased/pending/locked entries. Live Meta/native video limitations from Phase 2 remain. Unified UI is not evidence that native video analysis now works.

Hidden input fieldsets are disabled so they do not block native parent-form validation. Media buttons use type=button; Enter in media input cannot submit flight search. Parent search also guards against a non-text source or in-progress media operation. AI/video interlock keeps the source picker fixed during work while leaving media cancellation operable. Selected source is local UI state; no database migration.

## Verified

- **378 tests pass**, zero failed/skipped: prior 375 + three React rendering contracts for selector localization/disabled behavior, absence of standalone panel/nested forms, inactive fieldsets and transcript consent. Existing provider/payment tests remain mocks.
- Typecheck and Vite production build pass; inherited large-chunk warning remains.
- Localization: **1,573 keys, zero errors or untranslated JSX literals**.
- Real localhost browser: Explore text→link→transcript→upload→text, prompt value retained, useful canonical-link fallback, transcript/upload action disabled without input/consent. No extraction submitted.
- Real itinerary browser: source picker inside the single existing Assistant; video mode hides ordinary AI controls. Existing itinerary remains visible and unchanged. No Save pressed.
- ID/EN switching; mobile 390×844 measured documentWidth375 ≤ viewport390, exactly one visible itinerary Assistant, zero standalone video panels.
- Screenshots desktop-id.png and mobile-en.png. No real content upload, model extraction, database save, cancel-during-provider-run or live payment was performed for this UI task.

Files: app/assistant-source-picker.tsx, app/video-itinerary.tsx/.css, app/flight-search.tsx, app/ai-planner.tsx, app/travel-app.tsx, app/i18n/locales/video.json, checks/assistant-source-ui.test.mjs. Phase 2 evidence allowlist updated for these authorized existing-source changes; original Phase 2 QA remains historical, this report records the follow-up.
