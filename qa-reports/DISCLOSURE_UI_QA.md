# Assistant conversation and itinerary disclosures

Date: 23 October 2026, Asia/Jakarta. Branch: `codex/qa-production-readiness-2026-10-23`. Implemented and tested locally; no commit, push or deployment.

## Result

PASS for the scoped UI change. Conversation history and item details start closed. A labelled Show/Hide control opens the full content. The conversation composer, AI progress/error/cancel controls and quota information remain available outside conversation history. Item titles, times, prices and existing Edit controls remain visible. The same item disclosure is used in catalogue itineraries, worldwide itineraries and the map's stop list. The Costs & bookings tab retains its existing explicit controls.

The native `details` / `summary` component supports Enter, Space and normal keyboard focus. Labels switch between Indonesian and English, include the translated item name, expose expanded state and reference a unique content target. Summary touch height is at least 44 CSS pixels. Content remains mounted when hidden, so nested form selections survive closing/reopening. No business mutation or network request is added to the toggle handler. Switching trips remounts independent, initially closed panels. Expansion is a view preference, not a saved itinerary field.

## Automated verification

- TypeScript and Vite build: PASS (`2026-10-23/evidence/disclosure-build.log`). The pre-existing large-entry-bundle warning remains; no new performance claim.
- Full regression: **261 tests PASS, 0 FAIL, 0 SKIP**, including two new disclosure rendering/accessibility contracts (`disclosure-regression.tap`).
- Translation coverage: **1,379 keys, 1,019 static calls, zero errors or unexpected literal texts** (`disclosure-i18n.json`). Three previously recorded brand literals remain intentional.
- Whitespace/diff validation: PASS. Pre-existing unrelated changes and deletion were preserved.
- Final local HTTP smoke: homepage200, checkout200, health200 and unknown page404, all PASS (`disclosure-http.json`). The agent-owned Worker was restarted after the build so its local asset manifest matched the new files; credentials and financial flags were unchanged.

## Real browser verification

**29 interaction scenarios PASS** and **42 layout samples PASS**. All 14 item disclosure controls in the saved Kuala Lumpur trip were individually opened and closed. Layouts cover closed/open states in Indonesian and English, expanded map items and a worldwide itinerary at 320, 375, 390, 768, 1024, 1440 and 1920 CSS pixels. No top-level horizontal overflow; no visible disclosure summary below the 44px minimum height. Evidence: `2026-10-23/evidence/disclosure-ui.json`.

| Scenario | Verified result |
| --- | --- |
| Initial state | Existing Kuala Lumpur trip: one conversation and 14 item panels closed. |
| Conversation toggle | Full existing conversation opens; label and expanded state update. |
| Keyboard | Enter closes conversation; Space closes and Enter reopens an item. |
| Independent items | Opening one item leaves other items and conversation closed. |
| Nested route controls | Route legs, source links and existing booking controls appear after expansion. |
| Retained state | Select WALK without requesting a route; close/reopen item; WALK and nested subpanel remain selected/open. |
| Tab order | Tab from collapsed route summary skips its hidden controls and reaches the visible Edit button. |
| Editing | Edit still opens the existing hotel dialog; closing without applying preserves the record. |
| Language | ID→EN changes Show/Hide labels while preserving the current open state. |
| Hotel action | Expanded Find/change hotel opens the native search form with the existing city, dates and one adult. No search/selection/payment submitted. |
| Map | Stop details start closed; expansion and zoom in/out work. |
| Costs tab | Existing booking and editing controls remain available. |
| Integrity | Existing composer value, saved indicator, IDR4,500,000 budget and 10 AI results retained. |
| Worldwide itinerary | Existing Bali trip: two item panels closed; flight panel opens the existing affiliate/status controls. No empty conversation toggle. |
| Switching trips | Bali→Kuala Lumpur resets to independently closed panels. |
| All item controls | Each of the 14 item toggles opens exactly one panel, updates its expanded state, and closes again independently. |

The browser's role-based locator did not identify native `summary` elements even though the accessibility tree exposed their expanded/collapsed state. Tests used the observed summary attributes for keyboard actions; this was a test-driver locator limitation, not a product failure.

## Boundaries

No AI generation, price refresh, Google route request, saved itinerary edit, paid-status change, deletion, booking, payment or customer message was performed. English narrative display translation may run through the existing language mechanism; the disclosure toggle itself adds no API call. Financial actions and actual supplier conversions were not re-tested for a UI-only change. Full screen-reader/WCAG certification is outside these scoped checks.

This report supplements the earlier master QA snapshot; it does not replace its recorded production/payment/RLS/notification limitations. The new rendering contracts do not prove transaction readiness. No white-label dependency was introduced.

## Changed implementation

- `app/expandable-details.tsx`: reusable native disclosure.
- `app/ai-planner.tsx`: collapsed history and legacy summary; composer and operation feedback stay outside.
- `app/travel-app.tsx`, `app/world-planner.tsx`, `app/route-map.tsx`: collapsed per-item detail wrappers; existing callbacks retained.
- `app/travel-refresh.css`: responsive summary/content styling and keyboard focus.
- `app/i18n/locales/{id,en}.json`: localized Show/Hide and accessible-name labels.
- `checks/disclosure-ui.test.mjs`: rendering contracts.

## Screenshots

![Collapsed itinerary, desktop](<C:/Yusuf Ridlo/belajar koding/Platform Itinerary/sortTrip_VSCode_Local/sortTrip-local/qa-reports/2026-10-23/evidence/disclosure-itinerary-final.png>)

Additional screenshots: `disclosure-assistant-collapsed.png`, `disclosure-itinerary-collapsed-mobile.png`, `disclosure-itinerary-expanded-mobile.png` under the same evidence directory. Screenshots are actual browser captures, not mockups. Browser language restored to Indonesian and viewport override reset after QA.
