# Production readiness decision

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

## Decision

**NO-GO for unrestricted native booking/payment launch.** The complete payment/booking lifecycle, isolated Trip Pass sandbox settlement, deployed two-user RLS isolation and scheduled alert delivery have not been established. These are verification gaps, not proof that the providers have failed. No P0 was observed in this bounded audit.

**CONDITIONAL GO for limited discovery and affiliate browsing.** Keep cached fares, estimates, starting prices and provider handoffs clearly labelled. Do not promise a reservation or reliable alert delivery without supporting evidence. Local QA changes are not released. This audit did not change production exposure or financial settings.

| Area | Assessment |
| --- | --- |
| Homepage/navigation/help | WORKING — Browser ID/EN, menus, FAQ and seven-width sampled layouts; in-memory view limitation documented. |
| Flight discovery/search/details | PARTIALLY_WORKING — Cached indicative Data API, five route smoke checks; origin fixed list, final airline inventory/checkout external. |
| Standalone Hotel menu | WORKING — Trip.com affiliate widget and fallback link; no Nuitée White-label dependency. Conversion not verified. |
| Itinerary hotel discovery/content | WORKING — Fresh production local200:47 budget offers,24photos/2room types/36facilities/10reviews in sampled hotel. Bounded coverage, not cheapest-city guarantee. |
| Native hotel checkout/Payment SDK | PARTIALLY_WORKING — Protected production401; owner historical embedded form rendered. Local readiness503; financial lifecycle not verified. |
| Viator discovery/affiliate | PARTIALLY_WORKING — Production search200/one starting-price product and existing Genting link. Local sandbox drift; dated option availability not verified. |
| 12Go transport | PARTIALLY_WORKING — Official widget rendered; affiliate link contracts; no native transport inventory or exact-date fare verification. |
| AI itinerary generation | PARTIALLY_WORKING — OpenAI structured validation/retention contracts and live narrative translation;12 new-profile generations not run on owner data. |
| Saved itinerary read/edit | PARTIALLY_WORKING — Existing trip read; modal open/close and budget model contracts; no destructive/saving action on owner record. |
| Whole-trip delete/duplicate/share/export | NOT_IMPLEMENTED — Item actions do not establish whole-trip tools. |
| OSM map and Google WALK | WORKING — Map/markers/zoom render; authenticated Google44 min / 3 km with guarded remaining counter. TRANSIT/DRIVE current run not tested. |
| Authentication and RLS | PARTIALLY_WORKING — Existing session persists; unauth/origin gates pass; deployed two-user isolation not attested. |
| Password-reset flow | NOT_IMPLEMENTED — No frontend reset flow found. |
| Midtrans and Trip Pass | PARTIALLY_WORKING — 30k/30 days/10successes accountwide, legacy retained, fixtures pass; isolated sandbox settlement pending. |
| Price Watch lifecycle | PARTIALLY_WORKING — Source cron/leases/drop notices, fixtures and existing last-check; cannot call working without scheduled delivery proof. |
| Hotel watch/threshold/history chart | NOT_IMPLEMENTED — Flight new-low alerts only. |
| Telegram customer support | PARTIALLY_WORKING — Two-way text source/fixtures; live controlled delivery pending; category/attachment/reopen additions absent. |
| Telegram task agent | PARTIALLY_WORKING — Allowlist/temp queue fixture tests; actual Desktop wake/runner bridge remains unverified, no real queue inspected. |
| Localization | PARTIALLY_WORKING — 1374 keys, safe corrections, ID/EN views; vendor/source prose and legal review exceptions retained. |
| Production configuration | PARTIALLY_WORKING — Public health/API read-only smoke; source fixes unreleased, remote cron/migration/backup attestation pending. |

## Release acceptance

Review the local fixes and release only on explicit instruction. After release, repeat the production unknown-page 404, robots, sitemap, checkout and authentication smoke checks. Verify the effective RLS/RPC migration state with controlled accounts. Complete the isolated Midtrans lifecycle and any owner-operated Nuitée SDK booking/recovery test with appropriate authorization. Establish scheduled Price Watch receipt and a controlled support conversation. Review privacy wording, static security headers, backup/restore evidence and mobile performance.

Historical rollback reference: 8f76d368-5417-4498-a44f-ee7c038e5a19. A fresh remote-version attestation was not performed. White-label 403 is excluded from release gates by the latest owner instruction; the active API + SDK path does not depend on LAS-3147.
