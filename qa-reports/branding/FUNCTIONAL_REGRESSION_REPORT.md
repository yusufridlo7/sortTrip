# Functional regression

Date: 24 October 2026. Branch: `codex/approved-brand-identity-2026-10-24`. Status: local implementation ready for review; no commit, push or production deployment.

| Check | Result |
|---|---|
| Baseline unit/integration suite |307 passed |
| Final unit/integration suite |312 passed; zero failures |
| TypeScript and Vite production build |Pass; existing~1MB uncompressed main-bundle advisory remains |
| Localisation |1,469 keys; zero coverage errors or untranslated JSX literals |
| Asset path/MIME/dimension safety |All requested SVG/PNG/ICO/manifest entries checked; actual local responses hash-match files |
| Legal article content |Terms/privacy articles exactly equal baseline |
| Header/footer/navigation |Explore, Flights, Hotels, Transport, Help, My trips inspected |
| Language |ID/EN switching and reload persistence verified; Indonesian restored |
| Login/register |Modal opening, required fields, local mode switch, focus and close verified; no credentials submitted |
| FAQ/support |Expansion and guest login gate verified; no real message sent |
| Saved itinerary |Opened read-only; itinerary/map/cost tabs, Assistant/pass display inspected; no Save, Edit, AI update or purchase toggle |
| Price Watch |Read-only existing view; no activation/update/stop/email-toggle action |
| Hotel checkout |Branded empty chooser shell; no payment/Prebook/reservation created |

No new paid supplier call or model generation was used to demonstrate the UI. Existing routes, affiliate identifiers, pricing/margin/quota, callbacks, database policies, cron and payment verification remain unchanged by this branding package. The pre-existing KLIA source edits were carried over, not replaced.

No branding import or brand-asset console failure remains after fixing the local QA entry's relative import. An existing third-party `emrld.ltd` “config is not valid” console message was observed while navigating the development/review context; its affiliate script is unchanged. Trip.com/12Go external widget inventory is not certified by the visual-shell check.

## Dependency audit

`npm audit` reports three development-toolchain entries: undici(high), miniflare(moderate), wrangler(moderate). The lockfile change for this task is only an explicit root Sharp declaration; the affected package versions were already present. The audit suggests a breaking Wrangler downgrade, so no automatic `--force` fix was applied. Advisories: GHSA-4qv8-2p9j-2685, GHSA-f72v-6w45-q472, GHSA-xjj6-f33q-929c. Track compatible maintenance separately. This is not a verified exploit in deployed SortTrip code.

Raw local logs: `artifacts/branding-baseline.tap`, `branding-regression.tap`, `branding-build.log`, `branding-i18n.json`, `branding-npm-audit.json`. These ignored logs contain no intentionally collected credential values. Browser and HTTP evidence is under this report directory.
