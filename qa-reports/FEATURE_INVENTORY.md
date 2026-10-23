# Feature and architecture inventory

Audit date: 23 October 2026 (Asia/Jakarta). Branch: codex/qa-production-readiness-2026-10-23. Local QA fixes only; no commit, push, deploy, migration, credential/financial setting change or real booking/payment/customer message. Pre-existing owner changes were preserved.

White-label Nuitée is outside the active product path and is not a release gate. Standalone Hotels uses Trip.com; itinerary hotels use Nuitée API + Payment SDK.

| Feature | Classification | Evidence / limit |
| --- | --- | --- |
| Homepage/navigation/help | WORKING | Browser ID/EN, menus, FAQ and seven-width sampled layouts; in-memory view limitation documented. |
| Flight discovery/search/details | PARTIALLY_WORKING | Cached indicative Data API, five route smoke checks; origin fixed list, final airline inventory/checkout external. |
| Standalone Hotel menu | WORKING | Trip.com affiliate widget and fallback link; no Nuitée White-label dependency. Conversion not verified. |
| Itinerary hotel discovery/content | WORKING | Fresh production local200:47 budget offers,24photos/2room types/36facilities/10reviews in sampled hotel. Bounded coverage, not cheapest-city guarantee. |
| Native hotel checkout/Payment SDK | PARTIALLY_WORKING | Protected production401; owner historical embedded form rendered. Local readiness503; financial lifecycle not verified. |
| White-label Nuitée | NOT_TESTED | Removed from active product QA/release gates by owner direction. Historical403 is archived and is NOT a launch blocker. |
| Viator discovery/affiliate | PARTIALLY_WORKING | Production search200/one starting-price product and existing Genting link. Local sandbox drift; dated option availability not verified. |
| Klook | NOT_TESTED | Legacy widget/source, not the current hotel menu or active native inventory provider. |
| 12Go transport | PARTIALLY_WORKING | Official widget rendered; affiliate link contracts; no native transport inventory or exact-date fare verification. |
| AI itinerary generation | PARTIALLY_WORKING | OpenAI structured validation/retention contracts and live narrative translation;12 new-profile generations not run on owner data. |
| Meta collaboration | NOT_IMPLEMENTED | No Meta adapter found. |
| Saved itinerary read/edit | PARTIALLY_WORKING | Existing trip read; modal open/close and budget model contracts; no destructive/saving action on owner record. |
| Whole-trip delete/duplicate/share/export | NOT_IMPLEMENTED | Item actions do not establish whole-trip tools. |
| OSM map and Google WALK | WORKING | Map/markers/zoom render; authenticated Google44 min / 3 km with guarded remaining counter. TRANSIT/DRIVE current run not tested. |
| Authentication and RLS | PARTIALLY_WORKING | Existing session persists; unauth/origin gates pass; deployed two-user isolation not attested. |
| Password-reset flow | NOT_IMPLEMENTED | No frontend reset flow found. |
| Midtrans and Trip Pass | PARTIALLY_WORKING | 30k/30 days/10successes accountwide, legacy retained, fixtures pass; isolated sandbox settlement pending. |
| Price Watch lifecycle | PARTIALLY_WORKING | Source cron/leases/drop notices, fixtures and existing last-check; cannot call working without scheduled delivery proof. |
| Hotel watch/threshold/history chart | NOT_IMPLEMENTED | Flight new-low alerts only. |
| Telegram customer support | PARTIALLY_WORKING | Two-way text source/fixtures; live controlled delivery pending; category/attachment/reopen additions absent. |
| Telegram task agent | PARTIALLY_WORKING | Allowlist/temp queue fixture tests; actual Desktop wake/runner bridge remains unverified, no real queue inspected. |
| Localization | PARTIALLY_WORKING | 1374 keys, safe corrections, ID/EN views; vendor/source prose and legal review exceptions retained. |
| Production configuration | PARTIALLY_WORKING | Public health/API read-only smoke; source fixes unreleased, remote cron/migration/backup attestation pending. |

## Architecture and routes

React19/Vite8 TypeScript frontend; client sections Explore, Flights, Trip.com Hotels, Transport, My trips, Help and planner tabs. Public static routes /, /terms(.html), /privacy(.html), /404.html; /hotel-checkout SPA entry handled by Worker. Cloudflare Worker routes source adapters, Supabase auth/RLS/RPC/records, OpenAI planning/translation, Aviasales cached fares, Nuitée rates/content/SDK, Google Routes, Viator, Midtrans, Resend and separate Telegram support/agent services.

| Endpoint family | Responsibility |
| --- | --- |
| /api/health | Configuration booleans, not downstream connectivity |
| /api/locations | Destination catalogue autocomplete |
| /api/flights | Indicative cached flight search |
| /api/itinerary and /translate | Authenticated planning and display translation |
| /api/hotels/search and /content | Production catalogue/rates/details/reviews |
| /api/hotels/checkout/* | Rooms/session/start/finalize/status/history; see source for action contracts |
| /api/routes/google | Explicit bounded authenticated computeRoutes |
| /api/activities/* | Viator search/health |
| /api/payments/* | Midtrans checkout/status/access/webhook |
| /api/support/* | Text tickets/messages/Telegram webhook/config |
| scheduled(event) | Hourly Price Watch, two-minute support outbox; live remote configuration not attested |

## Source/UI control inventory

Counts are lexical tags, not distinct rendered controls or proof of clicking all controls. They locate every selected file for further reproduction. Repeated dynamic cards, destructive controls, owner account settings, external transactions and credential forms require the separate boundaries in the matrix.

| File | Lines | Interactive tags | Literal API paths |
| --- | --- | --- | --- |
| app\activity-selection.ts | 16 | 0 |  |
| app\activity-tickets.css | 3 | 0 |  |
| app\activity-tickets.tsx | 40 | 8 | /api/activities |
| app\ai-item-details.tsx | 13 | 5 |  |
| app\ai-planner.tsx | 69 | 12 | /api/payments/access, /api/itinerary |
| app\api-flights.ts | 26 | 0 | /api/flights |
| app\apply-ai-plan.ts | 54 | 0 |  |
| app\apply-price-quotes.ts | 35 | 0 |  |
| app\auth-app.tsx | 40 | 0 |  |
| app\auth-panel.tsx | 33 | 4 |  |
| app\booking-status.tsx | 11 | 1 |  |
| app\bounded-fetch.ts | 7 | 0 |  |
| app\brand-logo.tsx | 3 | 0 |  |
| app\brand.ts | 3 | 0 |  |
| app\cities.ts | 59 | 0 |  |
| app\city-planner.tsx | 18 | 9 |  |
| app\database-trips.ts | 27 | 0 |  |
| app\day-plan-data.ts | 10 | 0 |  |
| app\day-trip.tsx | 10 | 9 |  |
| app\destination-input.tsx | 12 | 4 | /api/locations |
| app\direct-search.tsx | 44 | 9 |  |
| app\flight-affiliate.ts | 8 | 0 |  |
| app\flight-booking.tsx | 20 | 2 |  |
| app\flight-search.tsx | 66 | 23 |  |
| app\globals.css | 187 | 0 |  |
| app\google-route-check.tsx | 24 | 7 | /api/routes/google |
| app\hotel-checkout-link.mjs | 11 | 0 |  |
| app\hotel-checkout.css | 38 | 0 |  |
| app\hotel-checkout.tsx | 91 | 22 | /api/hotels/checkout/ |
| app\hotel-details.tsx | 13 | 4 | /api/hotels/content |
| app\hotel-photo.tsx | 5 | 1 |  |
| app\hotel-photos.ts | 7 | 0 |  |
| app\hotel-planner.tsx | 15 | 1 |  |
| app\hotel-search.tsx | 45 | 19 | /api/hotels/search |
| app\hotel-stay.ts | 16 | 0 |  |
| app\i18n\index.ts | 32 | 0 |  |
| app\i18n\language-switcher.tsx | 3 | 1 |  |
| app\i18n\narratives.tsx | 29 | 1 | /api/itinerary/translate |
| app\info-note.tsx | 8 | 1 |  |
| app\item-booking.tsx | 32 | 8 |  |
| app\itinerary-price.tsx | 18 | 0 |  |
| app\klook-hotel-widget.ts | 30 | 1 |  |
| app\local-transport-data.ts | 22 | 0 |  |
| app\local-transport.tsx | 8 | 4 |  |
| app\local-trips.ts | 17 | 0 |  |
| app\partner-selection-form.tsx | 16 | 10 |  |
| app\partner-selection.ts | 39 | 0 |  |
| app\price-watch.tsx | 12 | 4 |  |
| app\provider-compare.tsx | 12 | 1 |  |
| app\provider-data.ts | 6 | 0 |  |
| app\replace-flight.ts | 16 | 0 |  |
| app\return-flight.tsx | 13 | 4 |  |
| app\route-map.tsx | 32 | 3 |  |
| app\supabase.ts | 8 | 0 |  |
| app\support-center.tsx | 27 | 10 | /api/support/, /api/support/config |
| app\support.css | 3 | 0 |  |
| app\transport-affiliate.mjs | 31 | 0 |  |
| app\transport-booking.tsx | 9 | 2 |  |
| app\transport-data.ts | 5 | 0 |  |
| app\transport-search.tsx | 34 | 1 |  |
| app\transport-widget.ts | 3 | 1 |  |
| app\travel-app.tsx | 108 | 57 | /api/trips |
| app\travel-data.ts | 54 | 0 |  |
| app\travel-discovery.css | 11 | 0 |  |
| app\travel-discovery.mjs | 12 | 0 |  |
| app\travel-refresh.css | 240 | 0 |  |
| app\trip-hotel-search.css | 2 | 0 |  |
| app\trip-hotel-search.tsx | 19 | 1 |  |
| app\trip-pass.tsx | 71 | 4 | /api/payments/, /api/payments/access, /api/payments/status |
| app\trip-save.ts | 28 | 0 |  |
| app\world-planner.tsx | 25 | 16 |  |
| worker\ai-draft.js | 22 | 0 |  |
| worker\external-hotel-browser.js | 22 | 0 |  |
| worker\google-routes.js | 52 | 0 |  |
| worker\hotel-checkout.js | 170 | 0 | /api/hotels/checkout/, /api/hotels/checkout/history, /api/hotels/checkout/rooms, /api/hotels/checkout/status, /api/hotels/checkout/payment, /api/hotels/checkout/prebook, /api/hotels/checkout/book |
| worker\hotel-content.js | 21 | 0 |  |
| worker\hotel-discovery.js | 48 | 0 |  |
| worker\hotel-search.js | 22 | 0 |  |
| worker\index.js | 117 | 0 | /api/support/, /api/payments/, /api/itinerary/translate, /api/itinerary, /api/hotels/search, /api/hotels/content, /api/hotels/checkout/, /api/routes/google, /api/activities, /api/activities/, /api/health, /api/locations, /api/flights |
| worker\itinerary.js | 120 | 0 |  |
| worker\lite-hotel.js | 116 | 0 |  |
| worker\liteapi-cost-policy.js | 19 | 0 |  |
| worker\localization.js | 25 | 0 |  |
| worker\narrative-translation.js | 30 | 0 |  |
| worker\payments.js | 87 | 0 | /api/payments/webhook, /api/payments/access, /api/payments/owner-test, /api/payments/status, /api/payments/checkout |
| worker\price-research.js | 79 | 0 |  |
| worker\price-watch.js | 28 | 0 |  |
| worker\supplier-browser.js | 10 | 0 |  |
| worker\support.js | 62 | 0 | /api/support/telegram/webhook, /api/support/config, /api/support/conversations |
| worker\transport-browser.js | 74 | 0 |  |
| worker\transport-plan.js | 20 | 0 |  |
| worker\trip-access.js | 9 | 0 |  |
| worker\trip-hotel-browser.js | 99 | 0 |  |
| worker\viator.js | 117 | 0 | /api/activities/health, /api/activities |
| components\ui\button.tsx | 65 | 0 |  |
| components\ui\combobox.tsx | 311 | 0 |  |
| components\ui\dialog.tsx | 160 | 0 |  |
| components\ui\input-group.tsx | 171 | 0 |  |
| components\ui\input.tsx | 22 | 1 |  |
| components\ui\select.tsx | 191 | 0 |  |
| components\ui\switch.tsx | 36 | 0 |  |
| components\ui\tabs.tsx | 92 | 0 |  |
| components\ui\textarea.tsx | 19 | 1 |  |
| supabase\ai-access.sql | 48 | 0 |  |
| supabase\ai-pass-account-scope.sql | 58 | 0 |  |
| supabase\ai-quota-v2.sql | 53 | 0 |  |
| supabase\google-routes-budget.sql | 46 | 0 |  |
| supabase\liteapi-checkout.sql | 31 | 0 |  |
| supabase\payments.sql | 33 | 0 |  |
| supabase\price-watch-itinerary.sql | 36 | 0 |  |
| supabase\price-watch.sql | 78 | 0 |  |
| supabase\schema.sql | 35 | 0 |  |
| supabase\support-chat.sql | 102 | 0 |  |
| supabase\trip-pass-10.sql | 24 | 0 |  |
| supabase\trip-pass-price-30000.sql | 9 | 0 |  |
| scripts\agent\controller.mjs | 35 | 0 |  |
| scripts\agent\logging.mjs | 9 | 0 |  |
| scripts\agent\notifications.mjs | 39 | 0 |  |
| scripts\agent\queue.mjs | 49 | 0 |  |
| scripts\agent\runner.mjs | 38 | 0 |  |
| scripts\agent\security.mjs | 25 | 0 |  |
| scripts\agent\transport.mjs | 13 | 0 |  |
| scripts\check-cloud-browser-limits.mjs | 8 | 0 |  |
| scripts\check-hotel-browser.mjs | 10 | 0 |  |
| scripts\cloud-browser-limits-worker.mjs | 14 | 0 |  |
| scripts\google-routes-budget-check.mjs | 22 | 0 | /api/health |
| scripts\google-routes-live-check.mjs | 28 | 0 |  |
| scripts\hotel-browser-check-worker.mjs | 8 | 0 |  |
| scripts\hotel-browser-check.jsonc | 7 | 0 |  |
| scripts\hotel-owner-login-worker.mjs | 89 | 0 |  |
| scripts\hotel-owner-login.jsonc | 9 | 0 |  |
| scripts\hotel-owner-login.mjs | 41 | 8 |  |
| scripts\i18n-coverage.mjs | 12 | 0 |  |
| scripts\liteapi-check.mjs | 28 | 0 |  |
| scripts\liteapi-checkout-check.mjs | 26 | 0 |  |
| scripts\liteapi-content-check.mjs | 7 | 0 |  |
| scripts\liteapi-hotel-check.mjs | 45 | 0 |  |
| scripts\liteapi-prebook-availability-check.mjs | 22 | 0 |  |
| scripts\qa-hotel-content.mjs | 9 | 0 | /api/hotels/search, /api/hotels/content |
| scripts\qa-live-providers.mjs | 10 | 0 | /api/flights, /api/activities |
| scripts\qa-localization-fixes.mjs | 19 | 0 |  |
| scripts\qa-readiness.mjs | 63 | 0 | /api/health, /api/qa-unknown, /api/locations, /api/flights, /api/hotels/search, /api/hotels/checkout/history, /api/payments/status, /api/payments/webhook, /api/support/config, /api/support/telegram/webhook, /api/routes/google, /api/itinerary, /api/activities/health |
| scripts\qa-report.mjs | 275 | 0 | /api/health, /api/locations, /api/flights, /api/itinerary, /api/hotels/search, /api/hotels/checkout/, /api/routes/google, /api/activities/, /api/payments/, /api/support/ |
| scripts\support-webhook.mjs | 14 | 0 | /api/support/telegram/webhook, /api/support/config |
| scripts\telegram-agent.mjs | 71 | 0 |  |
| scripts\telegram-notify.mjs | 85 | 0 |  |
| public\404.html | 3 | 2 |  |
| public\policies.css | 2 | 0 |  |
| public\policies.js | 10 | 0 |  |
| public\privacy.html | 20 | 10 |  |
| public\terms.html | 18 | 16 |  |
| index.html | 19 | 0 |  |
| main.jsx | 10 | 0 |  |
| wrangler.jsonc | 34 | 0 |  |
| wrangler.hotel-browser.jsonc | 34 | 0 |  |
| vite.config.js | 13 | 0 |  |

## Environment names

Names only, no environment values/files read: AI_LIMITER, ASSETS, GOOGLE_MAPS_API_KEY, GOOGLE_ROUTES_DAILY_LIMIT, GOOGLE_ROUTES_ENABLED, GOOGLE_ROUTES_MONTHLY_LIMIT, GOOGLE_ROUTES_USER_DAILY_LIMIT, HOTEL_BROWSER, HOTEL_BROWSER_ENABLED, HOTEL_PRICE_SERVICE_ENABLED, HOTEL_PRICE_SERVICE_TOKEN, HOTEL_PRICE_SERVICE_URL, LITEAPI_API_KEY, LITEAPI_BOOKING_LIVE_APPROVED, LITEAPI_CHECKOUT_ENABLED, LITEAPI_CHECKOUT_MODE, LITEAPI_ENABLED, LITEAPI_WHITELABEL_URL, MIDTRANS_ENV, MIDTRANS_SERVER_KEY, OPENAI_API_KEY, OPENAI_MODEL, OWNER_HOTEL_SESSION, OWNER_TEST_ENABLED, OWNER_USER_ID, PAYMENTS_ENABLED, PRICE_WATCH_FROM, RESEND_API_KEY, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, SUPPORT_TELEGRAM_BOT_TOKEN, SUPPORT_TELEGRAM_CHAT_ID, SUPPORT_TELEGRAM_WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TRAVELPAYOUTS_API_TOKEN, VIATOR_API_KEY, VIATOR_ENVIRONMENT, VIATOR_LIMITER, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_URL. Configuration/account ownership is not inferred from variable names.

## Database source inventory

SQL files: schema.sql; payments.sql; ai-access.sql; ai-quota-v2.sql; ai-pass-account-scope.sql; trip-pass-10.sql; trip-pass-price-30000.sql; price-watch.sql; price-watch-itinerary.sql; google-routes-budget.sql; support-chat.sql; liteapi-checkout.sql. Tables/policies/grants/RPC source index: evidence/sql-policy-index.txt. Historical files are not a safe automatic migration order.
