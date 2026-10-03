# Suggested addition to AGENTS.md

Before performing meaningful SortTrip work:

1. Read `docs/PROJECT_CONTEXT.md`.
2. Read `docs/PRODUCT_VISION.md`.
3. Read `docs/PARTNERS.md`.
4. Read `docs/ARCHITECTURE.md`.
5. Read `docs/DECISIONS.md`.
6. Read `docs/PROJECT_PROGRESS.md`.
7. Read `docs/NEXT_ACTIONS.md`.

Treat these documents as persistent project memory.

Rules:
- Never assume a discussed partner is approved or integrated.
- Use `PARTNERS.md` as the partner-status register and update it only when there is reliable evidence.
- Distinguish planned, simulated, implemented, API-connected, approved, tested, and production-ready states.
- After meaningful work, update `PROJECT_PROGRESS.md`.
- When partner status changes, update `PARTNERS.md`.
- When an architectural/product decision changes, update `DECISIONS.md`.
- When priorities change, update `NEXT_ACTIONS.md`.
- Never store passwords, OTPs, API keys, access/refresh tokens, cookies, recovery codes, or other secrets in project-memory files.
- Sensitive authentication and irreversible approvals remain owner-controlled.
