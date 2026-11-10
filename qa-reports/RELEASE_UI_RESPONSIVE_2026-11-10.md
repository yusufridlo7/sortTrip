# SortTrip UI responsive release — 10 November 2026

Owner authorizes commit, push and deploy of existing SortTrip. Main repository `yusufridlo7/sortTrip`, branch `pra-hackathon`, Worker `sorttrip`, frontend `dist`. Hackathon is no longer an ongoing workstream. No change to the separate submission repository is needed for this release.

## Release content

Desktop board styles and responsive mobile/tablet adaptation, real CC0 skyline photo and credits, existing callbacks retained. Include previously deployed but uncommitted runtime safeguards/source corrections so the main-repo commit can reproduce the current deploy: shared Meta spending guard, source/route/hotel corrections and current privacy/context. No new database migration or budget change is part of this release. Existing uncommitted backups, videos, SQL proposals, credentials and competition artifacts are excluded.

## Preflight

- Desktop/mobile targeted suites:60PASS,0FAIL.
- Runtime compatibility/safety suites:161PASS,0FAIL (suite overlap; not a claim of221unique tests).
- TypeScript/Vite buildPASS; Wrangler deploy dry-runPASS outside sandbox.
- AST handler/props contractPASS; staged diff whitespace checkPASS.
- Git remote checked: `origin/pra-hackathon` at baseline `b463a3224f0bbf0442fc0e2c335c3d55de9f2374` before push.
- Static secret-pattern scan on exact staged files; no secret files included. This is bounded validation, not a guarantee that all sensitive strings can be detected.

Deploy existing Worker with `npx.cmd wrangler deploy --keep-vars`. Preserve dashboard variables/secrets, bindings and existing cron schedules. Do not invoke AI, suppliers, prebook, payment or database writes for release verification.

Postflight evidence and deployment version will be recorded locally after release. Rollback is the preceding Cloudflare version, followed by static/health smoke verification; do not reset database history or alter spend guards.
