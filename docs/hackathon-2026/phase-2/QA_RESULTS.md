# Phase 2 QA results

27 Oct 2026, local. Start/end HEAD `737fbc5636145fc27a0bf4ac41be831835dfbd44`. See evidence logs for the final exact counts and completion metadata. No live Meta/supplier/model/financial integration is certified.

## Automated scope

Full suite: Node `checks/*.test.mjs`: **375 passed, 0 failed, 0 skipped** (329 prior regressions + 46 new cases). Covers canonical URL normalization, malformed/unsupported/private/lookalike/redirect attempts; streamed byte cap/cancel; MP4 MIME/signature/container/duration/external refs; auth/origin/limiter/consent; model schema/evidence/unknowns/duplicate handling; compatible draft/dates/map identity; budget denial/invalid-cap gates/RPC facade/SQL source policy; mocked provider success, 401/429/404/500, deadline/cancel/malformed/no-usage behavior; no retry/refund/fallback. These are fixture tests, not native footage/provider E2E.

Existing flight/hotel/AI/maps/auth helpers, Trip Pass, Price Watch, support, save queues and payment mock regressions are rerun. Full suite initially failed because sandbox blocked temp files and the test-only i18n/temp module resolver did not know the new locale/shared catalog. Resolvers were extended without weakening assertions; final suite is rerun outside the sandbox for temporary-file access. No customer Telegram message is sent by those mocks.

Typecheck plus Vite production build **PASS**. Existing >500kB main chunk warning remains. No lint configuration/script exists; lint is NOT CONFIGURED, not claimed pass. ID/EN coverage scanner extended for the new dictionary and OpenStreetMap proper name: **1,567 keys, 0 errors, 0 untranslated JSX literals**. Dependency manifests unchanged; inherited advisories remain unresolved.

## Real local browser checks

Desktop and 390×844 mobile: open/close entry, reject Instagram lookalike, accept canonical Shorts with honest inaccessible-content fallback, explicit labelled demo, edit name invalidates identity and disables generation, restore exact name, add/remove manual row, switch ID↔EN, create new unsaved Trip in existing planner, view existing edit/save controls and OSM marker. At mobile width, measured document width did not exceed viewport. Screenshots: desktop-en-review.png, mobile-en-fallback.png and mobile-en.png. Browser-native date/time picker UI follows browser locale; SortTrip labels switch correctly. No real Save/booking/payment was pressed.

Media upload/auth/schema/rate/cancel failure paths were fixture tested; not every asynchronous state was manually induced in browser. No real MP4 speech/visual recognition or live Meta result exists. Existing preview lacked Worker recommendation responses; unrelated cards displayed their existing unavailable state. This is not a newly proven production outage.

## Corrections found during QA

Fixed new schema syntax and fixture arrow syntax, temp resolver imports, locale scanner catalog, manual-review provenance label, stale/model-supplied verification, duplicate defense, bounded schedule times, stalled-stream cancel, explicit provider timeout classification and interlock between existing AI and new extraction controls. No unrelated UI redesign or production configuration edit.

Remaining gates are described in OWNER_ACTION_REQUIRED.md; Phase 2 remains PARTIAL and Phase 3 NOT READY despite passing local checks.

## Subsequent UI/integration evidence — 27 October 2026
The375-test/1567-key figures above describe the initial Phase2 checkpoint. Combined caption plus attachment follow-up passed384 tests and1583 keys; latest global popup help follow-up passed25 targeted UI/payment tests, typecheck/build and1587-key localization scan. Full384 was not rerun after the panel changes. Browser verifies translated popup content, close/Escape/outside click, focus return/Tab containment, and390px mobile without overflow. See [latest consolidated report](LAPORAN_TAHAP_2_TERBARU.md) and qa-reports/assistant-combined/QA_REPORT.md. Native video, actual Meta inference, enforced live budget and Save/RLS remain unverified; no deploy/payment.
