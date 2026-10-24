# Support local/production handoff — 24 October 2026

Owner selected production chat for now. No local credentials read or modified.

- Public config HTTP200:localhost5173 enabled=false; localhost8787 enabled=false; production enabled=true. Production configuration alone was not taken as delivery proof.
- Actual signed-in production Help UI loads existing thread history including team replies and the message composer. No new customer/Telegram message sent. Owner independently confirmed online version works.
- Local UI now explains local chat is not enabled and offers Open SortTrip online with a fixed HTTPS destination, new tab and noopener/noreferrer. It does not forward customer text or authentication tokens to production.
- Connection errors retain Retry; intentional disabled configuration does not offer a misleading retry. Retrying now resets the loading state.
-13 support regression tests pass; i18n1496keys with no errors; TypeScript/Vite build pass. Existing bundle-size warning remains.
- Browser verified local explanatory text/link and production history/composer. Evidence:branding/evidence/support-production-available.png.
- Local UI changes are not committed/pushed/deployed. Production configuration and code unchanged. Local chat stays disabled by owner choice.
