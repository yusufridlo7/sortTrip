# QA baseline

27 October 2026. Fresh local verification against baseline `737fbc5`, with original dirty state preserved. No implementation fixes were made to obtain passing results.

| Check | Command / evidence | Result |
|---|---|---|
| Runtime | `node --version`, `npm --version` | v24.22.1/npm11.19.1; package engine >=22.13.0 satisfied |
| Installed dependencies | `npm ls --depth=0` → `evidence/dependencies.log` | PASS, no missing/invalid top-level dependency reported; no install/lock rewrite |
| Type checking | `tsc --noEmit` is the first step of `npm run build` | PASS; TS strict compiler configuration; no standalone lint substitution |
| Unit/mocked integration | `node --test checks/*.test.mjs` → `evidence/unit-tests.log` | **329 passed /0 failed /0 skipped**,43 test files inventoried |
| Frontend build | `npm run build` → `evidence/build.log` | PASS; existing main JS >500kB warning, no new code bundled |
| Lint | `package.json`, config inventory | NOT CONFIGURED: no lint script/ESLint config found; not claimed pass |
| Localization | `node scripts/i18n-coverage.mjs` → `evidence/i18n.json` | PASS,1500keys; zero key/interpolation errors/untranslated JSX literals. Original provider content/future AI outputs not certified |
| Dependency advisories | `npm audit --json` → `evidence/npm-audit.json` | Exit1 because3affected packages:1 high / 2 moderate;0 critical. Existing toolchain issue, not a new test failure |
| Secret patterns | custom bounded read-only scanner → `evidence/secret-pattern-scan.json` | Zero findings in stated scope; no secret/env file read; not full history audit |
| SQL policy review | source review → `evidence/sql-policy-inventory.json` | RLS/revoke/ownership controls found; live deployment and A/B isolation NOT VERIFIED |
| Public metadata/security headers |6bounded unauthenticated GETs → `evidence/public-readonly-probes.json` | homepage/health/support/Viatorhealth200; hotelhistory401; unknownAPI404. Headers gap documented |
| Git preservation | before snapshot/hash manifest plus final comparison | Original WORKFLOW deletion and original progress-note prefix preserved; no branch/tag/index/history write |

## What mocked tests establish

They exercise flight/date/price normalization; provider request schemas and unsafe URL filtering; AI research/draft/quota and validation; hotel quote/occupancy/night/area replacement; immutable paid/pending/user locks; airport/museum connections; Google timestamp/budget/auth handling; checkout payable/consent/state protections; Midtrans signature/status and pass accounting; support allowlist/redaction/replay; local-agent queue safeguards; recommendation arithmetic; localization/branding boundaries. Detailed titles: `evidence/test-inventory.json`. Mocked provider responses are not fresh supplier inventory or financial settlement proof.

The tests may write isolated temporary files. Windows sandbox permission was requested for local test/build execution; no live partner/model/customer operations were authorized by that escalation. Public probes were limited to metadata/static/auth gates; no search that could invoke a supplier, no OAuth/login, no authenticated DB write, no model token debit and no customer message.

## Historical evidence, kept separate

The Oct 24 QA/release reports record real AI edits, dated hotel/12Go/Viator results, Google checks and a production payment form. They existed before the hackathon audit. They do not prove today's credentials, future inventory, migrated RLS or complete settlement lifecycle. Fresh health/config flags mean configured, not exercised end-to-end. Nuitée White-label is excluded by owner product direction; it is not an open release gate.

## Not executed / owner or future phase

- Fresh browser end-to-end ID/EN/responsive coverage, auth/OTP/password recovery and two-user database isolation.
- Live OpenAI/Meta calls, credits/billing validation, model catalog access with credentials, video extraction/recognition quality or timing.
- Hotel Prebook/Book/Pay/refund/cancel, Midtrans transaction creation/status reconciliation/settlement, Google or paid provider queries.
- Price Watch scheduler/email/Telegram delivery; support send/reply; autonomous Telegram polling/runner.
- Deployment, dry-run involving cloud authorization, branch/tag creation, commit/push and migration execution.
- Clean-environment `npm ci` reproducibility: installed tree was checked, but a new install was not needed and would alter the local dependency state. A later isolated CI run should confirm the lockfile from scratch.

## Phase 1 versus existing issues

Introduced application failures: **none observed**, because application source/config/lockfile were not changed. Existing actionable findings: dependency advisories, absent lint gate, large bundle, missing homepage security headers, public flight rate-limit gap, incomplete live financial/RLS/notification evidence. No auto-fix or claimed production readiness. See [SECURITY_AUDIT.md](SECURITY_AUDIT.md).
