# QA and brand release — 24 October 2026

Owner explicitly requested commit, push and deploy all remaining work from today. Application package prepared on `codex/approved-brand-identity-2026-10-24`.

Includes approved brand assets/favicon/theme/footer, account menu/profile/pass summary, explicit AI item locks, airport-night hotel and stale transfer fixes, chronology validation, known-target parallel research/AI waiting feedback, pending mutation protection, Google millisecond timestamp acceptance, airport map connections/OSM museum points, official dated admission references, hotel/widget retry and partial budget display, and Viator city-state matching. Related tests and current summary reports included.

Pre-release: 329 regressions pass; TypeScript/Vite build passes; localization scan passes; Worker dry run passes; staged diff check passes. Source/build scan reports zero secret-pattern findings; staged-file scan reports zero findings. Existing large frontend chunk advisory remains.

Excluded: credentials/environment files (including the unrelated untracked environment example), raw diagnostic artifacts, old QA backup/evidence files, unrelated WORKFLOW.md deletion and accidental root filename. These remain local. No credential read/change or DB migration performed.

Deploy must use `--keep-vars` to retain dashboard configuration, including owner-updated Midtrans production settings; do not overwrite secrets. Owner reports cloud Server Key/mode/enablement updated and published. Local checkout readiness passed after restart; provider payment authorization/settlement is not verified. No new AI generation, prebook, booking or payment is part of release verification.

Production result and exact release identity will be appended after deployment and read-only smoke checks. Other limitations in `2026-10-24-full/QA_REPORT.md` and `VIATOR_FOLLOWUP.md` remain; those reports' local-only statements become historical for source actually published by this release.
