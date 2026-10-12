# SortTrip — Product Vision

## Target users
Initial target:
- Indonesian travelers.
- Especially first-time international travelers.
- Budget-conscious users.
- Users who benefit from Bahasa Indonesia and rupiah-oriented budgeting.

## Core capabilities
### Discovery and planning
- Destination discovery.
- Flexible destination/date planning.
- Trip-duration and traveler-count inputs.
- Budget-aware recommendations.
- AI itinerary generation.
- Editable and saved itineraries.

### Flights
The intended flight experience is worldwide rather than restricted to one country:
- country/city/date discovery,
- flight results,
- filtering and sorting,
- saving selected options into an itinerary,
- affiliate/deep-link booking where supported.

### Accommodation
Hotel/accommodation discovery remains part of the core product, but supplier/API availability must be verified before presenting live-bookable claims.

### Activities and destination experiences
Tours and activities are a major affiliate category. Viator is one of the partners investigated for this role.

### Additional future affiliate categories
Previously discussed categories include:
- eSIM,
- travel insurance,
- airport transfers,
- other travel services that can fit naturally into the itinerary.

### Saved trips and price monitoring
Users should be able to save a trip and, where reliable data access exists, monitor price changes rather than rebuilding the plan each time.

## AI design
Use AI as a router/orchestrator:
- lower-cost model for simple interactions where appropriate,
- stronger model for complex itinerary/planning work,
- external sources/APIs for factual live travel data.

AI-generated itinerary drafts should remain editable and should not overwrite confirmed/booked trip information.

## Monetization direction
Primary early monetization: **affiliate revenue from successful bookings/transactions**.

A click-out does not automatically mean revenue; commission depends on the partner's tracking, eligibility, completed booking, cancellation rules, and agreement.

Premium and sponsorship are later/optional monetization layers.

### Trip Pass concept
A previously discussed paid option is a **Rp15.000 per-trip Trip Pass**, potentially bundling:
- more advanced AI planning,
- detailed itinerary generation,
- budget optimization,
- saved trip features,
- export/share capabilities.

This is a product concept, not proof of an active paid production feature.

### Trip Pass revision — owner clarified 2026-10-09
Supersedes the earlier per-trip concept: Rp15.000 /30 days, usable for multiple existing or new trips in the same account, with20 successful Assistant results shared across those trips. Failed generations do not count; existing usage remains. Account-scope implementation is local and its database migration awaits owner application.


Owner revision2026-10-11: new Rp15.000 /30-day purchases grant10 successful Assistant results account-wide. Existing paid20-result passes retain their original limit, consumption and expiry. Exhaustion permits another same-price purchase; manual editing remains available.

2026-10-12 Pricing checkpoint: owner requested preparation of new Trip Pass tariff Rp30000,10 successful AI results/30days, preserving legacy pass rights and Rp15000 invoices. Implemented locally pending amount-constraint migration and release. Current production tariff remains Rp15000; browser-cost optimization explicitly deferred. Profitability requires measured total cost including failed attempts.
# Pricing release — 2026-10-12

Owner-authorized frontend/Worker release now uses Rp30.000 for new Trip Pass purchases with10 successful Assistant results over30days across trips. Legacy invoices and existing20-result pass rights remain preserved. Owner reported SQL preparation complete; actual paid settlement at the new tariff was not tested by agent. This supersedes earlier current-production Rp15.000 statements; hotel browser profitability and reliable supplier access remain unverified.
