# SortTrip approved brand implementation

Date: 24 October 2026. Branch: `codex/approved-brand-identity-2026-10-24`. Status: local implementation ready for review; no commit, push or production deployment.

## Delivered

Reconstructed the supplied pin/S/coral-dot identity as self-contained SVG paths, with outlined wordmarks, light/dark/vertical/monochrome layouts, favicon, Apple/PWA icons and bilingual social cards. No guideline screenshot crop, icon-library substitute or new logo concept was used.

Replaced the obsolete arrow mark in the shared `BrandLogo`, footer, authentication/loading UI and standalone hotel checkout. The approved icon now accompanies Assistant headings and the search composer. Localised taglines and tab titles switch with ID/EN. Static privacy, terms and 404 entries have the same identity and icon links. Root favicon aliases also contain the new artwork.

A shared `public/branding/brand-tokens.css` defines the exact approved palette plus accessible neutral/interaction tokens. Existing application CSS consumes the tokens; `app/brand-theme.css` owns logo sizing, interaction states, focus and responsive header rules. Navy/teal/cyan are primary; coral remains a selective logo accent. Semantic error/warning/success colours and provider attribution are preserved. No theme switcher was added: light is the current product default; the `.dark`/`data-theme=dark` variant was verified in a local test fixture.

## Files and reproducibility

See [asset inventory](BRAND_ASSET_INVENTORY.md) for all 26 brand-directory files and root aliases. Application files: `brand-logo.tsx`, `brand.ts`, `auth-app.tsx`, `auth-panel.tsx`, `ai-planner.tsx`, `flight-search.tsx`, `travel-app.tsx`, `i18n/index.ts`, ID/EN catalogues, existing CSS files, `main.jsx`, `index.html`, public policy/404 entries and `policies.js/css`. Added `brand-theme.css`, `site.webmanifest`, two generator scripts and five branding tests. Sharp0.35.5 is now an explicit development dependency; the lockfile adds only that root declaration, with no dependency-version upgrades.

Vector reconstruction: `scripts/generate-branding.py` (FontTools4.67.0, Windows Segoe UI Bold/Regular). Raster/ICO generation: `node scripts/generate-branding.mjs`. Font binaries are not redistributed. PNG/ICO assets are derived from the SVG artwork. The outline paths need no installed font in the browser.

The original editable SVG and original brand font were not supplied. The silhouette/route/dot are manually reconstructed and the wordmark uses Segoe UI Bold outlines; exact pixel/font matching is not claimed. Review [visual comparison](VISUAL_REGRESSION_REPORT.md).

## Verification

Baseline307 tests passed before branding. Final312 tests pass, TypeScript/Vite production build passes, i18n1,469 keys with zero errors/literal findings. Five new tests cover SVG safety, raster/ICO dimensions, entry/manifest paths, contrast and localisation. Exact measured320/375/390/768/1024/1440/1920 widths pass without horizontal page overflow in both languages, with a visible account label. All local brand assets/entry paths were checked over HTTP with byte hashes. See the linked QA reports for scope and exclusions.

![Branded homepage](evidence/after-desktop-id.png)

![Mobile homepage](evidence/after-mobile-id.png)

## Boundaries

Existing uncommitted/deployed airport-hotel changes were preserved when creating this branch. They are not part of the rebranding scope. The unrelated `WORKFLOW.md` deletion, secret/example environment files and ignored raw artifacts were left untouched. No secret read/change, payment setting, model/prompt change, booking contract change, customer message, new monitoring activation, AI generation or financial transaction was performed for branding QA.

Owner review/deploy approval and optional external browser/bookmark verification remain in [OWNER_ACTION_REQUIRED](OWNER_ACTION_REQUIRED.md). No deployment was attempted, per the brief.
