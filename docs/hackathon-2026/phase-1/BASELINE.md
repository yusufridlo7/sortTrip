# Phase 1 — repository baseline

Audit date: **27 October 2026, Asia/Jakarta**. Scope: audit and documentation only. Phase 1 is COMPLETE; Phase 2 remains NOT READY until the owner gates below are cleared. No new application feature, credential change, commit, tag, branch, push, migration or deployment was performed.

## Immutable starting point

| Item | Observed value |
|---|---|
| Repository | https://github.com/yusufridlo7/sortTrip |
| Current branch | `codex/approved-brand-identity-2026-10-24` |
| HEAD | `737fbc5636145fc27a0bf4ac41be831835dfbd44` |
| HEAD committed | 24 October 2026, 19:46:49 WIB; documentation of prior release |
| Last application commit | `83b333e93d25e1d558785b25b32b8006a7103c8b`, 24 October, 19:43:59 WIB |
| Runtime baseline | Node v24.22.1, npm 11.19.1 |
| Tracked dirty state before audit | Deleted `WORKFLOW.md`; modified `docs/PROJECT_PROGRESS.md` containing the earlier tutorial note |
| Other local work | Existing environment example, raw artifacts, tutorial deliverables, QA evidence/backups and an accidental root filename; not deleted, staged or read as instructions |

The repository was **not clean**. `evidence/git-baseline.json` preserves original status metadata and hashes of tracked dirty files; it contains 1,115 porcelain entries because individual files in untracked directories were expanded. That is not 1,115 new application changes. `evidence/tracked-baseline-manifest.json` records 389 existing tracked file hashes, excluding secret/environment paths; `WORKFLOW.md` was already absent. Phase 1 evidence was created before application tests. No environment/secret values were read.

## Pre-existing product, not hackathon novelty

Before the event window: React/Vite application; ID/EN localization; Explore with example budgets; flights via Travelpayouts/Aviasales; Trip.com hotel-menu widgets; Nuitée hotel rates/content/native checkout; 12Go affiliate/browser observations; Viator activities; OpenAI itinerary research/drafting; editable itineraries and explicit AI locks; OSM maps and Google Routes checks; budget accounting; Supabase auth/saved trips; account menu; Trip Pass/Midtrans; Price Watch; support Telegram bridge and separate restricted local-agent tooling. Source and test evidence are mapped in [REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md).

The current AI provider is **OpenAI**, not Meta: `worker/ai-draft.js:6`, `worker/itinerary.js:83`, `worker/narrative-translation.js`. No media-upload route, Meta adapter, video ingestion pipeline or media/job storage binding was found. A previous tutorial MP4 is a marketing deliverable, not Video-to-Itinerary functionality.

Current safe evidence: 329 tests pass; build/type checking passes; dependencies installed; localization scan passes; npm advisory check finds three affected packages. Detailed limitations: [QA_BASELINE.md](QA_BASELINE.md), [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## Baseline proposal — not created

- Future branch: `codex/meta-hackathon-2026`, starting from the SHA above after the owner chooses how to preserve the pre-existing dirty work.
- Future annotated baseline tag: `baseline/meta-hackathon-2026-pre-phase2-20261027`, targeting the SHA above.
- Do not reset/stash/commit unrelated files automatically. Do not backdate or rewrite history. A tag alone cannot represent uncommitted work; keep the status/hash evidence alongside it.
- In the submission, show baseline SHA versus final approved implementation SHA, a path/diff list, model/tool execution evidence, and a clear pre-existing/new-work table. Disclose inherited assets, third-party libraries and existing partner integrations.

## Event evidence and unresolved eligibility

[Meta's event page](https://dev.meta.ai/events/global-hackathon) confirms the Startup track, Build for Your World theme, October 26 kickoff and November 4, 21:00 ET submission time, subject to changes. That deadline converts to **5 November 2026, 09:00 WIB**. Acceptance of SortTrip/the owner is not established by this repository. The application deadline shown there has passed; do not create another registration.

The [organizer's linked waiver](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver) returned only a loading shell to the research tool. The full Official Rules, existing-product eligibility, submission fields and exact 30/25/20/25 judging weights were not independently verified from a readable primary rules document. Use the owner-supplied rubric as a planning assumption, not a legal eligibility finding. The three-minute demo is our proposed target, not a confirmed submission limit. See [OWNER_ACTION_REQUIRED.md](OWNER_ACTION_REQUIRED.md).

## Phase 1 change boundary

Only the reports/evidence in this folder and an appended project-progress/next-actions note are authorized outputs. Build regenerates ignored `dist/`; tests may write temporary ignored fixtures. Existing source, lockfile, settings, customer records and production remain unchanged. Nothing here authorizes Phase 2, a paid API call or a later deployment.
