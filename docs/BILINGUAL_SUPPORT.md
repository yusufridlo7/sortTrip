# SortTrip bilingual support — local implementation, 2026-10-11

Final continuation verified on 2026-10-12 (Asia/Jakarta).

Implemented on `feature/bilingual-support`. Existing uncommitted work was retained. This task has not committed, pushed or deployed the application.

## Behavior

- Compact Indonesian / English selector in navigation; immediate changes preserve mounted forms and itinerary state. Explicit localStorage preference wins over browser language. Unsupported browser languages fall back to Indonesian.
- Shared i18next catalogues cover SortTrip navigation, discovery, flight/hotel/transport interfaces, itinerary, maps, budget, Price Watch, Trip Pass, authentication, booking controls, notices, errors, loading and empty states. Supplier names, user input, stored categories, IDs and affiliate URLs remain data.
- `Intl` formats dates and amounts using the selected language. Changing language keeps IDR amounts in IDR. The formatter also accepts an explicit already-denominated currency such as USD or MYR; no currency conversion or new exchange-rate source/selector was introduced.
- AI research and drafting receive a validated `id`/`en` language. Invalid or absent language defaults to `id`; structured category/kind values and the existing draft schema remain unchanged.
- Existing AI narrative translations use a separate authenticated endpoint. It returns text entries only, without researching or replanning. Numeric facts/times and URLs must remain identical. Display translations never overwrite itinerary activities, routes, prices or bookings. The UI preserves user-written messages and hotel/place names.
- Translation results are reused in memory and in a bounded, account-scoped sessionStorage cache in the same browser tab. Cache disappears when the tab session is cleared. Failure retains original narrative and offers retry. Translation requests have a separate rate-limit key and do not count as a newly generated itinerary/price result. They can incur provider cost; they are bounded and use the existing configured model.
- Language preference is written as ordinary Supabase user metadata after a signed-in language change, without SQL/RLS migration. If no local preference exists, supported account metadata can restore it. Local preference remains usable if the remote update fails. Price Watch email templates read that metadata with Indonesian fallback.
- Worker JSON diagnostics use the request language header while retaining status, codes, amounts, checkout URLs and cache headers. HTML language, page title and description update with language. Single existing URLs are retained; no localized routes or hreflang alternates were added.

## Files created

- `app/i18n/index.ts`
- `app/i18n/language-switcher.tsx`
- `app/i18n/narratives.tsx`
- `app/i18n/locales/id.json`, `app/i18n/locales/en.json`
- `worker/localization.js`, `worker/narrative-translation.js`
- `checks/bilingual.test.mjs`, `checks/i18n-loader.mjs`
- `scripts/i18n-coverage.mjs`
- This report and `docs/bilingual-coverage.json`
- Preview evidence: `artifacts/bilingual-desktop-en.jpg`, `artifacts/bilingual-desktop-id.jpg`, `artifacts/bilingual-mobile-en.jpg`

## Existing files integrated

Frontend: `main.jsx`, `index.html`, `components/ui/dialog.tsx`, `app/api-flights.ts`, `app/travel-data.ts`, `app/hotel-stay.ts`, `app/travel-refresh.css`.

Interface components: `app/ai-item-details.tsx`, `app/ai-planner.tsx`, `app/auth-app.tsx`, `app/auth-panel.tsx`, `app/booking-status.tsx`, `app/brand-logo.tsx`, `app/city-planner.tsx`, `app/day-trip.tsx`, `app/destination-input.tsx`, `app/direct-search.tsx`, `app/flight-booking.tsx`, `app/flight-search.tsx`, `app/hotel-photo.tsx`, `app/hotel-planner.tsx`, `app/hotel-search.tsx`, `app/info-note.tsx`, `app/itinerary-price.tsx`, `app/item-booking.tsx`, `app/local-transport.tsx`, `app/partner-selection-form.tsx`, `app/price-watch.tsx`, `app/provider-compare.tsx`, `app/return-flight.tsx`, `app/route-map.tsx`, `app/transport-booking.tsx`, `app/transport-search.tsx`, `app/travel-app.tsx`, `app/trip-pass.tsx`, `app/world-planner.tsx`.

Backend: `worker/index.js`, `worker/ai-draft.js`, `worker/itinerary.js`, `worker/price-watch.js`.

Dependency declarations: `package.json`, `package-lock.json`. Existing fixture loaders updated to resolve actual localization: `checks/day-settings.test.mjs`, `checks/flight-itinerary.test.mjs`, `checks/partner-selection.test.mjs`, `checks/trip-hotel-browser.test.mjs`.

Project memory: `docs/PROJECT_PROGRESS.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/NEXT_ACTIONS.md`. Prior unrelated edits are not attributed to this task.

## Coverage and verification

`node scripts/i18n-coverage.mjs`: 1,080 keys in each language, 100% key parity, no missing static keys, no interpolation mismatches, no remaining literal JSX text in audited root `app/*.tsx` components. 871 static translation call sites; dynamic known catalogue strings and template patterns use the same resources. This is a scoped static audit, not proof that every possible third-party response is translatable.

`node --test checks/*.test.mjs`: **170 passed, 0 failed**, including seven new bilingual tests. Tests cover language detection/fallback, key/interpolation parity, pluralization, Intl formatting, AI request language/schema preservation, localized payment diagnostics, narrative fact rejection/authentication/no planning quota reservation, and bilingual Price Watch email output. Existing search, affiliate, itinerary, price-save, payment, access and security regression fixtures pass.

`npm run build`: TypeScript and Vite passed. Vite still reports the main bundle above 500 kB (about 882 kB minified); this was an existing bundle-size concern. Dependency installation reported six high-severity advisories in the dependency tree; no blanket dependency upgrade was performed.

`npx wrangler deploy --dry-run --config wrangler.hotel-browser.jsonc --keep-vars --outdir artifacts/bilingual-worker-bundle`: Worker bundle passed; Wrangler explicitly exited in dry-run mode. The sandbox initially denied its log-file write, so verification was repeated with approved execution. No production version was created.

Official Desktop browser on local `127.0.0.1:4173`: ID→EN and EN→ID changed labels immediately without leaving the itinerary. Refresh preserved both selected languages. Kuala Lumpur 30 January–1 February 2027 retained its date, budget input 4,500,000 and total 3,396,574 IDR; only display formatting changed. Hotel stay remained two nights. Flight options, hotel/transport controlled interfaces, itinerary and map labels were inspected in English; Indonesian hotel/transport labels were inspected after switching back. Mobile layout had no horizontal overflow, and its translated menu width was corrected. Browser ended on the existing itinerary in Indonesian, with viewport override reset.

Continuation on 2026-10-12 confirmed the newly added description meta tag and title switch in both languages, with the same itinerary date and total. Browser was initially English and was returned to English after this check. Desktop English evidence was refreshed.

## Limits and release verification

- New AI language/narrative output and email bodies were tested with fixtures; no live OpenAI generation, real email send, payment, purchase, logout/login cycle or production database migration was performed for this task.
- Supabase language metadata write/read is implemented; its remote persistence across devices has not been separately verified. Supabase-hosted auth email templates and external Midtrans/affiliate pages are outside SortTrip-controlled translations.
- Unknown supplier prose and user-created content remain unchanged. Model translation is not a guarantee of perfect linguistic fidelity; validation protects numeric facts and URLs, while schema separation protects itinerary structure.
- Existing cloud Trip.com access redirect and unavailable verified 12Go fares remain unresolved by localization. Do not claim a supplier fare/checkout or partner approval from these tests.
- English/MYR/USD format support does not imply converted budgets or currency selection. Existing budgets and payments remain IDR.

## Deployment instructions — only after owner approval

1. Review the branch diff carefully: prior working-tree changes are still present. Do not include unrelated files or any secret file in a commit.
2. Run `npm ci`, `node scripts/i18n-coverage.mjs`, `node --test checks/*.test.mjs`, and `npm run build` in the intended release environment.
3. No new secret or SQL migration is required for bilingual support. Retain existing model, Supabase, payment, affiliate and browser configuration.
4. Deploy the reviewed frontend and Worker together using the project's existing browser-enabled release configuration, e.g. `npx wrangler deploy --config wrangler.hotel-browser.jsonc --keep-vars`, only with explicit production authorization.
5. Check language switch/refresh, signed-in preference, one English and one Indonesian AI result, existing itinerary translation, map, affiliate tracking, email language and owner-controlled payment verification. Supplier access blockers require separate resolution.
