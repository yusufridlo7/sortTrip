# QA and brand release — 24 October 2026

Owner explicitly requested commit, push and deploy all remaining work from today. Application package prepared on `codex/approved-brand-identity-2026-10-24`.

Includes approved brand assets/favicon/theme/footer, account menu/profile/pass summary, explicit AI item locks, airport-night hotel and stale transfer fixes, chronology validation, known-target parallel research/AI waiting feedback, pending mutation protection, Google millisecond timestamp acceptance, airport map connections/OSM museum points, official dated admission references, hotel/widget retry and partial budget display, and Viator city-state matching. Related tests and current summary reports included.

Pre-release: 329 regressions pass; TypeScript/Vite build passes; localization scan passes; Worker dry run passes; staged diff check passes. Source/build scan reports zero secret-pattern findings; staged-file scan reports zero findings. Existing large frontend chunk advisory remains.

Excluded: credentials/environment files (including the unrelated untracked environment example), raw diagnostic artifacts, old QA backup/evidence files, unrelated WORKFLOW.md deletion and accidental root filename. These remain local. No credential read/change or DB migration performed.

Deploy must use `--keep-vars` to retain dashboard configuration, including owner-updated Midtrans production settings; do not overwrite secrets. Owner reports cloud Server Key/mode/enablement updated and published. Local checkout readiness passed after restart; provider payment authorization/settlement is not verified. No new AI generation, prebook, booking or payment is part of release verification.

Production result and exact release identity will be appended after deployment and read-only smoke checks. Other limitations in `2026-10-24-full/QA_REPORT.md` and `VIATOR_FOLLOWUP.md` remain; those reports' local-only statements become historical for source actually published by this release.


## Production outcome

Application commit `83b333e` pushed to origin/codex/approved-brand-identity-2026-10-24. Production deployed successfully with `--keep-vars`: version `5cb25add-5f48-4a05-a012-2d2f626a24ff`, https://sorttrip.yusufridlo7.workers.dev/ .

Fresh production smoke: homepage200; exact deployed JS, favicon and horizontal logo200 with bytes matching local build; health200 with itineraryRulesVersion2026-10-24-order-admission; recommendations200/threecities; supportconfig200/enabled; Viatorproductionconfigured and actual Singapore/Gardens search200/twoproducts. Unauthenticated hotel history401, paymentstatus401 and invalid-signature webhook403 are expected access-control results, not payment success or a direct Midtrans credential test.

Actual production browser1280px displays the new brand/theme, authenticated six-action account menu, and all three Budget mulai cards; no document horizontal overflow. No trip modified/saved, AI quota used, prebook or payment during release. Screenshot and safe probe results remain local at qa-reports/2026-10-24-full/evidence/release-production-home.png and production-release-smoke.json.

This supersedes local-only/pending-release status for the application changes in the included QA reports. Historical evidence limitations remain. Documentation-only completion commit requires no second application deployment. Raw local artifacts and unrelated deletion remain outside source control.
