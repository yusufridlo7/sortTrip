# Video input and access

Local implementation, 27 October 2026. Starting/ending HEAD: `737fbc5636145fc27a0bf4ac41be831835dfbd44`; uncommitted Phase 2 branch.

| Input | Implemented behavior | Limitation |
|---|---|---|
| TikTok | HTTPS exact tiktok.com/www host, @name/video/numeric ID, canonical host, strip query/hash | Short links unsupported; no downloader, metadata connector or authenticated platform access |
| Instagram | HTTPS exact instagram.com/www host and /reel/ID | No platform app scopes or media-access approval verified |
| YouTube Shorts | HTTPS exact youtube.com/www/m host and 11-character /shorts/ID | No captions download or audiovisual copying |
| Transcript/description | 12,000 UTF-8 byte cap, content/Meta-processing consent, authenticated server adapter | Text extraction only; live model/account/budget not verified |
| MP4 | 4 MiB, 60-second declared container duration, exact MIME, ftyp brand/box bounds/mvhd/dref inspection, progress/cancel | Container-only inspection, no codec safety/actual duration assurance; returns MEDIA_PROCESSOR_REQUIRED |

Rejects malformed URLs, HTTP, credentials, custom ports, lookalike hosts, encoded paths, IP/local addresses, redirects and unsupported paths. Canonical URLs are attribution only, never fetch targets. Link validation is available client-side without login; server requests authenticate first. A valid URL never creates a successful analysis.

Fallback in English: “We couldn't access this video's content. Upload a video you own or have permission to use, or provide a transcript.” Indonesian equivalent is provided.

Upload endpoint authenticates before reading media; explicit rights/processing header and limiter required. Declared size is checked, and actual streamed bytes are capped independently. Invalid/fragmented/encrypted/external-reference structures fail closed where inspected. Stalled stream cancellation cancels the reader. This is **not** a full media validator: codec/sample payloads, track dimensions and actual playback duration are not decoded. No user file was sent to any provider. Synthetic structural MP4 fixtures are labelled tests, not real-footage analysis evidence.

Retention: no R2, object storage, database media row, Meta file or logs. Worker bytes live only during the request; JavaScript garbage collection is not secure memory erasure. Browser-selected File is retained by the component until replacement/unmount. Cancel aborts client transfer; in-flight work may take until disconnect/deadline to stop. No durable background task is claimed. Future native video needs a sandboxed inspector and retryable deletion before activation, including explicit DELETE for non-expiring Meta Files.
