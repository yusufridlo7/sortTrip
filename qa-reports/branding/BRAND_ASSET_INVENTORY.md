# Brand asset inventory

Date: 24 October 2026. Branch: `codex/approved-brand-identity-2026-10-24`. Status: local implementation ready for review; no commit, push or production deployment.

All files below are in `public/branding/`. Source pin uses the same silhouette, white S route and coral dot. Monochrome/pinned variants deliberately use knockout details; the white variant retains the coral destination dot. Wordmarks are outlined paths.

| Asset | Bytes | Purpose |
|---|---:|---|
| `apple-touch-icon.png` | 5761 | Application icon |
| `brand-tokens.css` | 1162 | Central design tokens |
| `favicon-16x16.png` | 594 | Browser icon |
| `favicon-32x32.png` | 1125 | Browser icon |
| `favicon-48x48.png` | 1639 | Browser icon |
| `favicon-64x64.png` | 2141 | Browser icon |
| `favicon.ico` | 5569 | Browser icon |
| `favicon.svg` | 622 | Browser icon |
| `icon-192.png` | 6315 | Application icon |
| `icon-512.png` | 21178 | Application icon |
| `icon-maskable-512.png` | 16621 | Application icon |
| `social-en.png` | 42906 | Social sharing |
| `social-en.svg` | 9808 | Social sharing |
| `social-id.png` | 42770 | Social sharing |
| `social-id.svg` | 11041 | Social sharing |
| `sorttrip-icon-monochrome.svg` | 540 | Logo / brand mark |
| `sorttrip-icon-white.svg` | 588 | Logo / brand mark |
| `sorttrip-icon.svg` | 587 | Logo / brand mark |
| `sorttrip-logo-dark-en.svg` | 9710 | Logo / brand mark |
| `sorttrip-logo-dark.svg` | 10943 | Logo / brand mark |
| `sorttrip-logo-horizontal-dark.svg` | 3186 | Logo / brand mark |
| `sorttrip-logo-horizontal.svg` | 3186 | Logo / brand mark |
| `sorttrip-logo-light-en.svg` | 9710 | Logo / brand mark |
| `sorttrip-logo-light.svg` | 10943 | Logo / brand mark |
| `sorttrip-logo-monochrome.svg` | 3124 | Logo / brand mark |
| `sorttrip-logo-vertical.svg` | 3175 | Logo / brand mark |

Root `public/favicon.svg` and `public/favicon.ico` are matching compatibility aliases. `public/site.webmanifest` references192/512 and separately maskable512 icons. Favicon PNGs have16/32/48/64 dimensions; ICO embeds those four sizes. Apple icon180; social PNGs1200×630. PNGs are generated from the canonical SVG; maskable icon has a navy square canvas and safe inner mark. Versioned active links use `?v=3` to refresh old caches.

Self-contained vectors contain no executable script, remote media, external font dependency or third-party logo. Assets were visually inspected through the review gallery and byte-checked through HTTP; see `evidence/asset-http-checks.json`.
