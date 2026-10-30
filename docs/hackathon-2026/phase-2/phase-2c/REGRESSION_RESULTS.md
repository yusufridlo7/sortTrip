# Regression results

Evidence commands from repository root,27October2026:

```powershell
node --test checks/phase2c.test.mjs
node --test checks/phase2c.test.mjs checks/phase2b.test.mjs checks/video-itinerary.test.mjs checks/meta-qa.test.mjs checks/meta-qa-access.test.mjs
node --test checks/*.test.mjs
npm run build
node scripts/i18n-coverage.mjs
```

New Phase2C six tests initially allpassed. First sandbox fullrun failed on temporary queue-file rename EPERM plus two source-render tests. Approved outside-sandbox rerun isolated2real harness failures: import.meta.env.MODE absent in direct Node render. Test transpile loader now replaces MODE with test, as it already did DEV. Next fullrun **413passed/0failed/0skipped** in evidence/full-tests-final.log. Further diagnostic/UI changes after that run require final verification supplement below.

TypeScript/Vite buildPASS in evidence/build.log; bundle>500kB warning remains. i18n scanner1610keys/0errors/0untranslated JSX literals detected in evidence/i18n.json. Scanner does not certify AI translations. Existing fullsuite covers flight/hotel/financial components with fixtures; no production integration certification.

Actual desktop browser: QA login persists; budget diagnostic reaches sanitized error state503/upstream403/DATABASE_PERMISSION_DENIED and read-only action does not allocate. First screenshot found diagnostic panel clipping; scoped QA dialog CSS now constrains viewport/height and centers it explicitly. Post-fix visual and ID/EN checks recorded separately when executed. No mobile/live frame/TripPass/PriceWatch full behavior claim from this checkpoint.

No live Meta, booking, payment, customer support message, token display or productionrelease. See OWNER_ACTION_REQUIRED.md for gates.

## Final verification supplement — 27 October2026
Final fullsuite:414passed/0failed/0skipped (evidence/full-tests-final.log). NewPhase2C suite7passed (phase2c-tests.log); earlier targetedcombined77passed. TypeScript/Vite finalbuildPASS (build-final.log), bundlewarningretained. i18n1610keys/noerrors/literals. Finaldiagnostic/UIedits are covered by this rerun. ScopedQA dialog measured within1280pxDOMviewport afterViterestart: x380,width520; screenshot capture is narrower thanDOMviewport, so screenshots alone do not certify fullmobilelayout. Englishselectionpersisted onreload. Fixed budgetresultstoredtranslationstring soerrorstatus now translates onrender whenlanguagechanges. No mobile/realtimeTripPass/PriceWatch/Savecertification.

Browser final evidence: English error state rendered fully in English; after changing UI back to Indonesian, the existing error translated without another request (budget-permission-denied-id-final.png). Language persisted across reload earlier. QA dialog afterrestart measured x380,width520 within1280pxDOMviewport; screenshot backing capture narrower, visualmobile certification remainsopen. User tab46 preserved forhandoff; frontend5174 session27509 andbackend8790 leftunchangedafterQA. Finalreadstillupstream403/DATABASE_PERMISSION_DENIED, noreservationorMetaegress.

## After live text verification
Currentfullsuite414passed/0failed/0skipped(evidence/full-tests-after-live.log); TypeScript/VitePASS(build-after-live.log), bundlewarningretained; i18n1611keys/0errors/literals(i18n-after-live.json). QA-onlysanitizedrequestmetricsaddedtobrowser(noidentity/token/promptlogging). RemovedmisleadingstaticliveVerificationPerformed:falsefromstatusendpoint; fourQAentrytestsrepassed(status-after-live-tests.log). Runtimeafterrequestshowsanalysis/frame/budgetflagsfalse. ActualtextHTTP200andSave/reloadverifiedseparately; notmockevidence. Snapshotshowsnarrow584pxcapture; fullmobile/TripPass/PriceWatchnegativeRLSstillnotcertified.

## Two-account RLS and sampled-frame verification

419 full tests passed, zero failures/skips (evidence/rls-full-tests.log); TypeScript/Vite build passed (rls-final-build.log), existing bundle warning retained. i18n1621 keys, zero errors (rls-i18n.json). New five RLS tests cover same-account refusal, owner integrity/canonical nested JSON, uncertain failures not passing, early stop and QA-only user/anonymous-client wiring. An existing static source assertion initially expected only MetaQAAccess; updated to require both panels behind the same meta-qa guard, then full suite passed.

Actual A/B/anonymous access and final unchanged owner rows passed through Supabase; see SUPABASE_RLS_QA.md. Actual three-frame Meta inference HTTP200 with correct empty destinations passed; see VIDEO_FRAME_ANALYSIS.md. No production certification, payment, full-video/ASR or real-travel recognition claim.
