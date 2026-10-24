# Account menu QA — 2026-10-24

Implemented locally; no commit/push/deploy.

## User interface
Authenticated avatar opens a Radix dropdown showing name/email and six actions: profile, saved trips, Trip Pass/AI allowance, Price Watch, help and sign out. Removed the separate header sign-out button; guests keep the existing sign-in entry. Booking history is not advertised as ready.

Profile shows current account name/email, IDR budget currency and the existing language selector. This is a read-only identity summary, not a credential or name-editing form. Currency is displayed as supported IDR, not an unimplemented preference. Pass dialog loads active account entitlement, remaining results, expiry and test-access distinction, with loading/error/retry/empty states. Purchase remains in the existing itinerary flow.

Account-level lookup uses explicit scope=account on the existing authenticated /api/payments/access path. It queries only the caller's passes and exposes the existing safe summary; no Midtrans reconciliation, checkout, grant, quota debit or provider call. Trip-level input validation remains in place for callers without account scope.

## Verification
- TypeScript/Vite build passed; existing bundle-size warning remains.
-318 automated tests passed, including authenticated/user-scoped/read-only account entitlement coverage and unauthenticated rejection.
- i18n coverage:1493 keys, no key/interpolation errors or unexpected JSX text.
- Actual local signed-in UI: menu open; profile open/close; pass API displays6 remaining through30October2026 with test-access label; saved trips loads4cards; Price Watch and Help route correctly. No watch activation or customer message.
- Isolated dummy-account preview:320px English menu within viewport, zero horizontal overflow; profile English/Indonesian switch; ArrowDown opens and focuses first item; Escape closes and restores trigger focus; busy trigger disabled; logout callback tested without signing out real owner.
- Sign-out integration continues to call existing AuthApp confirmation and local signOut; actual logout was not executed.
- Support route currently reports chat unavailable while FAQ works; existing service availability is not certified by menu routing.
- An initial interaction before loading the new bundle hit the old account button, whose pre-existing showSaved flow auto-saved the corrected owner draft. Owner was informed. No manual itinerary-content changes were introduced by this menu feature; prior route correction was persisted by that existing flow.
- Evidence:branding/evidence/account-menu-desktop.png and account-menu-mobile-en.png. Isolated preview lives in account-menu/preview.html, not production build entry points. Final retained preview is the real app root, not the fixture.
