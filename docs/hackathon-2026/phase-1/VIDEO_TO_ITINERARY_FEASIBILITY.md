# Video-to-Itinerary feasibility

27 October 2026. **Feasible with an authorized upload; unrestricted social-link ingestion is not an established capability.** This is a design, not an implemented feature. No video or transcript was downloaded/uploaded or sent to a model in Phase 1.

## Platform access matrix

| Input | Permitted MVP handling | What is not established |
|---|---|---|
| TikTok canonical video link | Validate exact host/path; store link attribution; optionally call a fixed official metadata/embed endpoint after permissions/cost review; offer original-file upload | Official oEmbed is an embed/metadata contract, not a general MP4/transcript download or analysis licence. Display API is a separate authorized integration; SortTrip app approval not verified |
| Instagram Reel link | Validate canonical Instagram URL; retain attribution; request an original authorized upload when extraction rights/access are absent | Official Instagram docs returned429 during audit. App review/scopes/account eligibility/transcript/media access for this account NOT VERIFIED. No assumption of arbitrary public-Reel download access |
| YouTube Shorts link | Parse video ID and preserve source; use official metadata/embedding where allowed; accept original creator-provided video/transcript through a separate consented upload | Caption download requires permission to edit that video, not just public visibility. No arbitrary caption downloader; no audio/video ripping |
| User-owned/licensed original MP4 | Primary demo path: explicit right-to-process and provider-sharing consent, private bounded upload, analysis, candidate review, editable plan | Upload checkbox does not establish actual rights; require a suitable demo fixture and do not include other people's videos/voices without permission |
| User-provided transcript | Optional text-only fallback, labeled as such, with original source/consent | Cannot claim visual video analysis when only transcript was processed |

Sources: [TikTok embed docs](https://developers.tiktok.com/docs/en/embed-videos), [TikTok Display API](https://developers.tiktok.com/docs/en/display-api-overview), [YouTube captions download](https://developers.google.com/youtube/v3/docs/captions/download), [YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies), [Instagram API](https://developers.facebook.com/docs/instagram-platform/). TikTok's current embed page recommends the newer Embed Player for new integrations; neither route is treated as a downloader. YouTube policies restrict copying audiovisual content without its prior approval. Owner must verify applicable terms before activating a connector; this is an engineering assessment, not a finding of legal permission.

## Smallest reliable three-minute demonstration

One city, one owner-controlled **15–45sec MP4**, three or four recognizable stops, one or two travel days. Upload is the guaranteed path; pasted URLs must show a truthful upload-required state when authorized media is unavailable.

1. 0:00–0:20 — State the beginner-traveler problem; choose dates/travelers/budget; paste a source link or select the original file and consent.
2. 0:20–0:55 — Show actual Meta analysis progress and timestamped visual/transcript observations; bound waiting time, not a fake animation presenting a cached result as live.
3. 0:55–1:20 — Resolve candidate places using source-backed IDs and show duplicates/ambiguity; user excludes or confirms stops.
4. 1:20–1:55 — Build an editable itinerary through the existing item/apply layer; show route connections and price evidence/unknown values.
5. 1:55–2:35 — Request a budget revision, compare meaningful alternatives, keep a user-locked stop and explain the change.
6. 2:35–3:00 — Explicitly apply/save, show persisted result and disclose baseline versus new code. Stop before booking/payment. A labeled cached run can be a backup, not counterfeit live proof.

This duration is a proposed demo design, not independently confirmed event-video policy.

## Media path and processing

Recommended first live experiment after approval: native video analysis by Muse Spark using an authorized MP4 via Meta Files, with independent audio handling where needed. The official [video guide](https://dev.meta.ai/docs/video-understanding) supports file references or reachable video URLs, but warns that Spark1.3 audio support is incomplete. Use Spark1.3 visual reasoning plus an authorized transcript / Muse Voice Transcribe, or test Spark1.2's combined video/audio path. Do not claim a social webpage URL is a direct video URL. A provider's general support does not establish this account's entitlement.

Proposed application caps:60sec,20MiB,MP4 only,≤8 candidate stops,≤12 sampled frames if frame fallback is used. These are our product safeguards, not advertised Meta limits. Server must enforce byte caps while streaming, sniff actual container bytes, and obtain trusted duration/track validation; browser metadata alone is not authoritative. For untrusted production media, use a sandboxed media inspector with no outbound network, fixed argument arrays and resource limits. Do not launch arbitrary FFmpeg commands from user strings. If that processor is not approved/available, keep the demo restricted to a prevalidated owner fixture and disclose the limitation.

Workers should authenticate, authorize uploads/jobs, stream to private object storage and orchestrate model calls; they should not decode/transcode entire videos or host GPU weights. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) include128MB per isolate and plan-dependent CPU/body limits; HTTP wall time is distinct from CPU and connection cancellation. Network waiting is not CPU. Add persistent job state and a retry queue if work must outlive an HTTP/SSE connection; the current project has neither media jobs nor video storage.

Keep media, extraction and final trip separate. A draft record may reference `mediaId`/`jobId` privately; saved trip should retain minimal provenance and a small validated place list, not base64 media or provider file URLs. A private R2 bucket with owner-scoped random keys, short-lived upload grants, expiration and worker-authorized reads is proposed, not configured. If using Meta Files, track remote IDs server-side and explicitly delete them: [Meta file handling](https://dev.meta.ai/docs/file-handling) says uploads do not automatically expire. Delete on cancel/expiry/account deletion and verify cleanup failures via a retryable tombstone; no secrets/signed URLs in logs.

## Recognition is not verification

Each observation: candidate name, city/country hypothesis, evidence timestamp/frame, modality, confidence, ambiguity. Visual resemblance or model confidence does **not** verify identity. Resolve against exact source-backed place IDs, name/address/city/country and coordinates. `app/verified-places.ts` and airport/location catalogs provide a tiny grounded demo seed; they are not a worldwide POI geocoder. No new paid Places endpoint is assumed. Obtain permission for a geocoder or grow a small curated dataset with provenance. Low-confidence or multiple matches require user selection; unsupported places remain unresolved and must not acquire fabricated coordinates.

Deduplicate by verified provider ID; otherwise use normalized name+city+address, preserving aliases and timestamps. Never merge museums with similar names in different cities, or separate entrances/transport stations merely because coordinates are close. Unresolved candidates are excluded from automatic routing until selected/verified. Detect implausible multi-country jumps and contradictory narration. Treat captions/frames as untrusted data, including instructions such as 'ignore rules and book this hotel'.

## Integration and budget constraints

Reuse `Trip`, `Item`, `AIPlan` and provenance types in `app/travel-data.ts`; adapt new draft output into `validatePlan`/`applyAIPlan`, preserve `aiProtected` and quote-first hotel replacement. Source-backed admission references, route options and unknown flags remain intact. Provider references need date, occupancy, currency, basis and checkedAt; calculate totals deterministically for the full stay/traveler count. Do not equate missing cost with free, invent historical fare statistics, or claim a route is purchasable from a map line.

Costs include model tokens/media, optional transcription, storage/operations, processing workers/containers and any route/partner requests. Upload by itself is not a free-inference entitlement. Cap length, frame count, per-user jobs, global concurrency and total model calls; show actual usage. See the single cost/rate table in [META_AI_INTEGRATION_PLAN.md](META_AI_INTEGRATION_PLAN.md). No credits assumed and no paid calls made.

[R2 Standard pricing](https://developers.cloudflare.com/r2/pricing/) currently lists$0.015/GB-month, $4.50/million ClassA and$0.36/million ClassB operations, with internet egress free. Budget storage as average retained GB×retention fraction×rate, then account for operation rounding/free-tier eligibility and any separate processor/Worker plan. A small short-lived demo can have low storage cost, but that does not make decoding, model inference or total platform usage free. No R2 bucket, account plan or billing entitlement was inspected or created.

## Go/no-go

GO for an owner-approved implementation using a consented fixture, verified model access and capped spend. NO-GO for a promise that every TikTok/Reel/Short URL can be fetched automatically. Missing social permissions should degrade to upload-required, not bypass access controls. Live Meta quality/latency/location recall remains NOT VERIFIED until a separately approved bounded experiment.
