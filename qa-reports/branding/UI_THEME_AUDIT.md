# UI theme audit

Date: 24 October 2026. Branch: `codex/approved-brand-identity-2026-10-24`. Status: local implementation ready for review; no commit, push or production deployment.

## Shared system and route coverage

| Surface | Implementation / verification |
|---|---|
| Explore, flight form/results/details, cards, recommendation dialog | Existing shared styles converted to tokens; form and navigation inspected; handler logic preserved |
| Standalone Hotels / Trip.com | SortTrip shell/footer themed; third-party iframe not restyled or commercially reconfigured |
| Transport /12Go | SortTrip shell/form wrappers themed; vendor script/links and iframe isolation preserved |
| Activities | Existing itinerary/Viator controls inherit themed buttons and cards; adapter, prices and attribution unchanged |
| Assistant, itinerary editor, daily rows, budget, tabs/map | Shared icon and tokens; actual saved-trip views, map/tab switches and cost controls inspected read-only |
| Saved trips/account view | Shared header/cards/footer; list opened read-only |
| Login/register | Branded form, required inputs, focus and local form switch inspected; no credentials entered/submitted |
| Standalone hotel checkout | Shared header and tokenised checkout CSS; empty chooser shell inspected; no quote/Prebook/payment action |
| Trip Pass / Price Watch | Existing cards, buttons and status surfaces inherit tokens; actual Price Watch view and pass entitlement display inspected without changing subscriptions |
| Support and FAQ | Tokenised support CSS; FAQ expansion, navigation and login gate inspected; no message sent |
| Terms/privacy/404 | Shared public tokens, static logos and favicon; bilingual content retained and legal article equality checked against baseline |
| Loading/error/notifications | Shared tokens plus branded account-loading screen; semantic success/warning/error palettes retained |

No standalone password-reset, profile-editor, general activity-index, PDF-export or rich transactional-email route was found. Those are not newly invented pages. Existing account access is through header/My trips; activities remain within itinerary. Plain-text Price Watch email and support Telegram templates already use SortTrip consistently, so no image-only content or unsupported HTML was added. No customer email was sent. No active Nuitée White-label product flow was reintroduced.

## Themes and accessibility

Light uses off-white page, white cards, navy text, teal controls. Dark tokens and matching white `Sort` wordmark were verified in an explicit local dark-root fixture, without adding a user-facing toggle or changing stored theme preferences. Financial success/error colours remain semantic rather than blindly converted to brand colours. Google/Leaflet/provider attribution remains intact.

Primary white-on-teal and body/muted/link colour pairs meet4.5:1 in the added tests. Focus rings use accessible teal/light cyan. Disabled buttons remain distinct and noninteractive. Coral is not used as small body text. Header sizes preserve SVG aspect ratios. Mobile/tablet account-label regressions discovered during QA were corrected and rerun.

Residual: the partner-controlled iframe/payment/card form cannot be branded with SortTrip CSS; no unsupported override was attempted. A dark fixture is a variant check, not proof of an existing production theme preference UI. Full assistive-technology certification was not performed.
