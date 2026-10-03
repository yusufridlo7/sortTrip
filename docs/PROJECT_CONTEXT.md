# SortTrip — Project Context

## Purpose
SortTrip is an AI-assisted travel planning and booking platform focused initially on Indonesian travelers, especially people planning their first international trips and travelers who are budget-conscious.

The product should help a user move from an idea such as “I want to travel abroad cheaply” to a practical, editable trip plan and then to booking actions through external partners.

## Core user journey
1. Choose or discover a destination.
2. Enter dates or flexible dates, trip duration, traveler count, and budget.
3. Compare flight options.
4. Discover hotels/accommodation.
5. Receive an AI-assisted itinerary.
6. Discover activities, tours, transport, food, and other useful trip components.
7. Estimate and optimize total trip cost.
8. Save and edit the trip.
9. Monitor relevant prices where supported.
10. Continue to external partner/affiliate booking links.

## Product principle
AI is an orchestrator and planning assistant, not the source of truth for live commercial facts. Prices, schedules, availability, visa rules, weather, and bookable inventory should come from appropriate APIs/databases/sources when available. The AI should not invent these facts.

## Current positioning
Working concept: **AI Travel Planner & Booking Assistant**.

SortTrip should combine planning across providers rather than becoming the merchant of record for every travel product during the initial phase.

## Important distinction
A feature being discussed or represented in the UI does not mean that a live supplier integration exists. Always distinguish:
- planned,
- simulated,
- implemented locally,
- connected to an API,
- partner-approved,
- tested,
- and production-ready.

## Security / owner-control policy
Passwords, OTP/2FA, CAPTCHA, API secrets, recovery codes, payment/bank information, and other sensitive credentials remain owner-controlled.

Agents may work with already-authorized sessions and environment-based configuration without revealing secret values. Never store secrets in project-memory documents.
