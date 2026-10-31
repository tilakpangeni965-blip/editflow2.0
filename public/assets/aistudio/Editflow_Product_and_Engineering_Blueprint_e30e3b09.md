# Editflow — Product and Engineering Blueprint

Version: 1.0  
Prepared: 2026-10-31  
Status: Proposed MVP specification; not evidence of validated demand  
Owner: Founder/product owner  
Format: Six coordinated documents in one Markdown file

## How to use this document

This is the implementation source of truth for the proposed Editflow MVP. Product choices and technology selections below are proposals, not claims about an existing application. An implementation agent must follow the contracts here, not invent additional features. Raise conflicts before changing architecture, billing, permissions, or data retention.

Document 3 interprets the requested “upload” document as **app flow**, including upload, navigation, and button behavior.

### Document index

1. PRD — Product Requirements Document
2. TRD — Technical Requirements Document
3. App Flow — Navigation, Upload, and User Journeys
4. UI/UX Design Brief
5. Backend Schema and Authentication
6. Implementation Plan

### Binding decisions

- Build a browser-based editor for uploaded talking-head footage, not a professional general-purpose editor.
- MVP: one main video source per project, one speaker assumed, optional manual crop, one caption track, one output aspect ratio per export.
- AI proposes transcript and silence cuts. The user controls final edits.
- First language targets: English and Nepali-English mixed speech. These are evaluation targets, not production quality claims. Hindi-English is deferred until benchmarked.
- No generative video, voice cloning, dubbing, autonomous publishing, native mobile app, or real-time collaboration in MVP.
- No feature may grant paid access based only on a browser redirect or uploaded payment screenshot.
- International checkout and Nepal merchant onboarding are release dependencies, not completed integrations.
- Never train on customer media without separate, explicit consent.
- Start with paid individual accounts. Workspace ownership exists structurally; team invitations and shared seats are deferred.
- Default limits are initial product settings and must be revisited after measured costs and pilot feedback.

### Proposed pilot limits

| Setting | Initial value |
|---|---|
| Input file | MP4 or MOV container; accepted only after server inspection |
| Input codecs | H.264 or HEVC video; AAC/PCM audio where decodable by the deployed FFmpeg build |
| File size | 1 GB maximum |
| Duration | 30 minutes maximum |
| Resolution | Up to 3840 x 2160 input; proxy preview and 1080p maximum output |
| Active processing | One heavy job per workspace initially |
| Output | H.264/AAC MP4; burned captions optional; SRT separately downloadable |
| Formats | 9:16 and 16:9; 1:1 deferred |
| Projects | One source clip per project; no multitrack composition |
| Pilot languages | English; Nepali-English beta only when quality gate passes |
| Retention | Source/proxy 30 days; exports 7 days; project metadata until deletion |
| Manual editing | Text/timing/style/crop corrections do not consume AI credits |

---

# 1. PRD — Product Requirements Document

## 1.1 Product overview

Editflow helps recurring talking-head creators turn raw recordings into clean, captioned videos. Users upload footage, receive a transcript and conservative silence-cut suggestions, correct captions, apply a brand style, preview edits, and export a finished video.

Core promise: **A faster first edit with control, understandable pricing, and a final export that matches the preview.**

Editflow does not promise perfect transcription, automatic virality, or replacement of professional creative judgment.

## 1.2 Problem statement

Creators can already generate subtitles with many tools. The proposed opportunity is reducing the remaining work: correcting mixed-language text, fixing timing and line breaks, undoing unwanted cuts, maintaining a consistent look, and producing reliable exports.

This opportunity remains a hypothesis until paid pilots demonstrate a useful advantage over existing workflows.

## 1.3 Personas

### Primary: recurring individual creator

- Publishes talking-head educational, coaching, or business videos.
- Uses a laptop/browser and uploads their own recordings.
- Wants a usable finished clip without learning a large timeline editor.
- Needs understandable limits and access to manual correction.

### Secondary pilot: small agency editor

- Produces repeated branded content for multiple clients.
- Values reusable caption styles and predictable processing.
- Uses one paid owner account initially; shared seats are not promised.

### Not the initial customer

Film editors, multicamera producers, animation studios, users needing complex audio mixing, and occasional users expecting unlimited free processing.

## 1.4 Goals and non-goals

### Goals

- Complete an upload-to-export workflow without staff intervention.
- Make every AI cut inspectable and reversible.
- Preserve source media while recording edits non-destructively.
- Keep subtitle text, timing, crop, and style consistent between preview and render.
- Show processing progress, limits, retention dates, and failures clearly.
- Demonstrate repeat paid usage in a pilot cohort.

### Non-goals

- Model training, text-to-video generation, or stock-media marketplace.
- A complete multitrack nonlinear editor.
- Automatic background removal, eye correction, voice cloning, or dubbing.
- Publishing directly to social platforms.
- Guaranteed engagement or revenue improvement.
- Automatic Nepal recurring debit without a verified commercial integration.

## 1.5 Scope and feature requirements

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| AUTH-01 | P0 | Email/password registration and sign-in | Verified user can access only authorized workspace data; logged-out access is rejected |
| AUTH-02 | P0 | Password recovery | Single-use expiring recovery flow; generic response prevents account enumeration |
| ONB-01 | P0 | Minimal onboarding | User selects content language and accepts terms; can reach first upload without payment when trial is available |
| PRJ-01 | P0 | Project creation | Unique project ID created; empty project can be renamed or deleted |
| UPL-01 | P0 | Resumable direct upload | Interrupted upload resumes while upload session remains valid; invalid limits rejected server-side |
| UPL-02 | P0 | Media inspection | Actual duration/codecs validated by worker; unprocessable inputs show actionable error |
| AI-01 | P0 | Transcription | Transcript linked to source timestamps; provider failures do not create duplicate usage charges |
| AI-02 | P0 | Suggested silence cuts | Suggestions shown separately; none destructively alter source; accept/reject and undo work |
| CAP-01 | P0 | Caption correction | User edits text/timing/line breaks; autosave status visible; no AI charge for manual correction |
| CAP-02 | P0 | Caption styling | Font, scale, colors, position, emphasis and background from supported controls persist |
| EDT-01 | P0 | Basic video editing | Trim start/end, accept/reject silence suggestions, manually adjust crop |
| EDT-02 | P0 | Non-destructive preview | Preview uses saved version; cuts and caption timing follow output timeline |
| EXP-01 | P0 | MP4 export | User exports immutable project version; progress shown; successful output downloadable |
| EXP-02 | P0 | SRT export | UTF-8 SRT uses post-cut output timestamps, not raw source timestamps |
| EXP-03 | P0 | Recoverable failure | Retry does not double-bill; job shows understandable error; stale partial output is never published |
| BIL-01 | P0 | Trial and entitlements | Server enforces included input minutes, file limits, and export entitlement |
| BIL-02 | P0 | Verified paid activation | Only server-verified payment or audited manual approval changes paid entitlements |
| PRI-01 | P0 | Deletion/retention | User sees expiry dates; source/project deletion follows documented lifecycle |
| OBS-01 | P0 | Operational visibility | Authorized operator sees job state and sanitized errors, not unrestricted user media |
| PRE-01 | P1 | Saved caption presets | Owner can reuse style within workspace; no arbitrary CSS/code |
| FDB-01 | P1 | Feedback on result | User can report transcription/export issue without automatically sharing media |
| BAT-01 | Later | Batch editing | Not visible as an MVP control |
| TEAM-01 | Later | Team collaboration | No invitation or shared-seat promises in pilot |
| API-01 | Later | Public API | Internal API only in MVP |

## 1.6 Editing behavior

- The source is immutable. All times are integer milliseconds.
- A project version contains sorted non-overlapping source keep ranges. Their concatenation forms the output timeline.
- No transitions between keep ranges in MVP; straight cuts only.
- Caption records reference source time. Export compilation converts them to output time after cuts.
- Words fully inside removed sections are excluded. Boundary words require a deterministic documented clipping rule.
- Silence suggestions never auto-apply during initial transcription.
- Manual caption text changes preserve timing unless the user changes timing. Re-alignment is an explicit later feature.
- Speaker identification is not promised.
- Styles use a curated installed font set with verified script coverage and license review.
- Word-highlight animation is enabled only where alignment is reliable; otherwise use static phrase captions.

## 1.7 Proposed plans and metering

These are configurable pilot hypotheses, not binding commercial promises.

| Plan | Proposed monthly price | Monthly input minutes | Editor seats |
|---|---:|---:|---:|
| Trial | Free | 10 one-time | 1 |
| Creator | $24 | 120 | 1 |
| Pro | $49 | 360 | 1 |
| Team | Deferred | Deferred | Deferred |

- Plans are versioned; changes never silently rewrite past purchases.
- Meter billable source processing once per asset and operation version, rounded up to whole seconds and displayed as minutes.
- Reserve usage before processing; commit after successful transcription pipeline; release on system failure or pre-processing cancellation.
- Re-rendering unchanged media does not consume transcription minutes, but enforce fair-use export concurrency and rate limits.
- Extra third-party AI actions require a separately priced explicit confirmation; none ship in MVP.
- No automatic credit rollover initially. Show period end and remaining balance.
- Local NPR prepaid packs may be introduced only after payments, margins, and accounting review.

## 1.8 Success criteria

Proposed gates, not industry benchmarks:

- Five qualified customers pay for a pilot before broad feature development.
- At least 50% of activated weekly-publishing pilot users complete a second project within 14 days.
- Median human editing/correction time improves at least 30% against that user's existing workflow on matched footage.
- At least 95% of eligible pilot exports succeed without operator repair.
- No critical preview/export mismatch in release test corpus.
- Measured direct delivery cost stays below 30% of net plan revenue at representative included usage, or revise pricing/allowances.

Define activation as first successful MP4 download, not signup. Track subscriptions and paid renewals separately from free activation.

## 1.9 Accessibility and platform support

- Desktop-first: latest two stable Chrome and Edge releases; Safari/Firefox require explicit playback/upload test coverage before claiming support.
- Mobile supports account, project status, billing, and downloads. Full editor is not a mobile launch promise.
- Keyboard navigation, visible focus, accessible labels, non-color-only status, reduced-motion option.
- Caption editing must support Devanagari input and mixed-script text without destructive normalization.

## 1.10 Risks and release dependencies

- Speech accuracy and timestamp quality may vary by language/provider.
- Browser subtitle preview may differ from server rendering unless tested carefully.
- Merchant approval and payout eligibility remain unconfirmed.
- Media processing can exceed budget without resource and concurrency limits.
- Release requires privacy policy, terms, refund policy, company/payment eligibility checks, and font/codec/software licensing review.

---

# 2. TRD — Technical Requirements Document

## 2.1 Architecture decisions

All named services are proposed selections. Before implementation, verify current API contracts, region availability, costs, licensing, and retention terms using their official documentation.

| Area | Proposed choice | Rationale / boundary |
|---|---|---|
| Language | TypeScript for web/API; Python for media workers | Shared web types; isolated media/model tooling |
| Frontend | Next.js App Router + React | Account pages, editor UI, internal server API |
| UI | Tailwind CSS + accessible component primitives | Consistent tokens, forms and dialogs |
| Editor state | Zustand; server snapshots as authority | Local responsive edits with explicit save/version contracts |
| API validation | Zod | Validate all request bodies and edit specifications |
| Database/auth | Supabase PostgreSQL + Auth | Managed identity and relational storage; enforce RLS |
| Database migration | Versioned SQL migrations | Explicit constraints, policies, triggers, and reproducibility |
| API data access | Server-only repository layer | Browser reads only permitted views; privileged mutations through checked endpoints |
| Queue | Redis + BullMQ in a Node dispatcher | Queue is orchestration, not durable product state |
| Media workers | Python container invoked by dispatcher using typed job contract | FFmpeg/ffprobe, audio extraction and pipeline work |
| Objects | Private S3-compatible storage, initially AWS S3 | Multipart upload, lifecycle retention, signed URLs |
| Rendering | Pinned FFmpeg build + explicit font bundle | Deterministic output; licensing review required |
| Transcription | Provider adapter; initial experiment with OpenAI transcription | Production choice depends on word-timing and code-switch benchmarks |
| Alignment | Separate adapter evaluated against forced-alignment tooling | Never assume transcription endpoint guarantees word-level timestamps |
| Email | Resend or equivalent approved provider | Transactional messages only; confirm deliverability/onboarding |
| Errors | Sentry with content scrubbing | No transcripts, tokens, media URLs, or secrets in events |
| Analytics | Minimal first-party events initially | Avoid sending raw content or personal text |
| Testing | Vitest + Playwright + pytest | Unit, browser, and media pipeline checks |
| Deployment | Docker-based API/worker hosting; managed Redis/Postgres | Keep rendering away from short-lived serverless handlers |
| International billing | Paddle adapter, pending supplier approval | Do not assume seller/payout approval |
| Nepal billing | Khalti checkout adapter first, pending merchant approval | One-time/prepaid entitlement; no recurring-debit assumption |
| MBL/connectIPS | Future adapter pending bank documentation | No invented personal-account webhook |

## 2.2 Repository layout

```text
apps/web/                     Next.js UI and authenticated API
services/dispatcher/          BullMQ consumers and Python process orchestration
services/media-worker/        Python media and AI pipeline
packages/contracts/           Zod schemas and generated worker JSON Schema
packages/edit-spec/            Timeline conversion and deterministic validation
packages/billing/              Provider adapters and entitlement logic
packages/ui/                   Tokens and shared UI components
supabase/migrations/           SQL schema, indexes, RLS and test fixtures
infra/                         Docker, environment templates and deployment notes
tests/fixtures/                Licensed synthetic media only
docs/                          Architecture decisions and operational runbooks
```

## 2.3 Processing pipeline

1. Authenticated user creates a project.
2. API creates multipart upload session after quota/file-size checks.
3. Browser uploads directly to private storage with expiring part URLs.
4. API completes multipart session and creates inspection job transactionally.
5. Worker validates actual media and extracts a low-size audio copy.
6. Server checks duration-based entitlement and reserves usage.
7. Worker creates preview proxy, transcribes, aligns, and detects conservative silence candidates.
8. Worker validates transcript/caption timings and persists intermediate results.
9. Pipeline marks project ready and commits usage in an idempotent transaction.
10. Editor loads a short-lived proxy URL and current project version.
11. Export creates an immutable version snapshot and compiles source-to-output mapping.
12. Worker renders MP4 and SRT, inspects result, publishes storage keys, and marks success.

A failed stage preserves valid upstream results where safe. Retrying a render must not retranscribe by default.

## 2.4 Internal API surface

All paths below are internal contracts, not a public API commitment.

| Method/path | Purpose | Required safeguards |
|---|---|---|
| POST /api/projects | Create empty project | Membership and project limits |
| GET /api/projects | List own workspace projects | Workspace filtering; pagination |
| GET /api/projects/:id | Load metadata/current version | Membership; no permanent media URLs |
| PATCH /api/projects/:id | Rename project | Owner authorization; length limit |
| DELETE /api/projects/:id | Request deletion | Explicit UI confirmation; audit event |
| POST /api/projects/:id/uploads | Start multipart session | Size cap, rate limit, scoped object key |
| POST /api/uploads/:id/parts | Sign requested part numbers | Ownership, session state, bounded parts |
| POST /api/uploads/:id/complete | Complete upload and enqueue inspection | Verify parts/size; idempotency key |
| DELETE /api/uploads/:id | Abort incomplete upload | Ownership; storage cleanup |
| POST /api/projects/:id/process | Start/retry eligible pipeline | Verified source, quota reservation, no duplicate jobs |
| GET /api/jobs/:id | Progress polling | Membership; sanitized errors |
| POST /api/jobs/:id/cancel | Best-effort cancellation | State machine and usage reconciliation |
| PUT /api/projects/:id/draft | Save draft edit specification | Expected revision; full validation |
| POST /api/projects/:id/versions | Freeze draft | Immutable hash/version; transactional |
| POST /api/projects/:id/exports | Render version | Entitlement, concurrency, version ID |
| GET /api/exports/:id/download | Issue expiring download URL | Ready state, membership, retention |
| GET /api/billing/summary | Entitlements and usage | Server-derived values only |
| POST /api/billing/checkout | Start approved provider checkout | Server price lookup; immutable order |
| POST /api/billing/webhooks/:provider | Receive provider event | Signature/raw body where required; dedupe |
| POST /api/billing/orders/:id/verify | Reconcile return from checkout | Provider backend verification; never client assertion |
| POST /api/account/deletion | Schedule deletion | Re-authentication; billing implications shown |
```

Use consistent error JSON: `code`, `message`, `retryable`, `request_id`, optional field errors. Never leak stack traces or provider secrets.

## 2.5 Project state machine

```text
DRAFT -> UPLOADING -> UPLOADED -> INSPECTING -> PROCESSING -> READY
             |            |           |            |
             +-> FAILED <-+-----------+------------+
READY -> READY (new edit revisions)
Any permitted state -> DELETION_PENDING -> DELETED
```

Exports have separate states: `queued`, `running`, `succeeded`, `failed`, `cancel_requested`, `cancelled`, `expired`.

Jobs use: `queued`, `running`, `retry_wait`, `succeeded`, `failed`, `cancel_requested`, `cancelled`.

Transient upload interruption is not automatically project failure. Job cancellation may finish an in-flight provider request, but must not publish output after confirmed cancellation.

## 2.6 Edit specification contract

```json
{
  "schemaVersion": 1,
  "sourceAssetId": "uuid",
  "keepRanges": [{"startMs": 0, "endMs": 8000}],
  "output": {"width": 1080, "height": 1920, "fps": 30},
  "crop": {"mode": "manual", "centerX": 0.5, "centerY": 0.5, "zoom": 1},
  "captionTrackId": "uuid",
  "captionTrackRevision": 1,
  "style": {
    "fontId": "approved-font-id",
    "fontScale": 1,
    "textColor": "#FFFFFF",
    "accentColor": "#A78BFA",
    "backgroundColor": "#111827",
    "backgroundOpacity": 0.7,
    "anchor": "bottom-center",
    "safeMarginPct": 10,
    "animation": "none"
  }
}
```

Validate sorted, non-overlapping ranges within source bounds; nonempty final duration; approved dimensions/fonts; valid normalized crop; bounded style values. Project versions additionally freeze caption contents and preset values, not just mutable IDs.

## 2.7 Reliability and limits

- Use DB outbox rows to publish jobs after transactions; reconcile missed queue delivery.
- Every mutating request/job/payment event has an idempotency key.
- Worker heartbeat and lease expiry detect abandoned jobs.
- Retry transient infrastructure/provider failures with bounded exponential backoff; do not blindly retry unsupported media.
- Limit CPU/memory, temporary disk, execution time, input size, and network access.
- Abort stale multipart uploads and purge worker scratch files.
- Do not fetch arbitrary user-submitted URLs in MVP.
- User-controlled retry cannot bypass entitlements or generate duplicate reservations.
- Queue progress is advisory; DB state is authoritative.

## 2.8 Security and privacy controls

- Supabase service role is server-only; never ship it in browser code.
- Enforce workspace RLS and API ownership checks; test both independently.
- Private bucket; object keys are not authorization.
- TLS, managed encryption at rest, secrets manager, secure cookies and CSRF protection for cookie-authenticated mutation routes.
- Scrub logs; never record full transcript, signed URL, payment token, or media payload.
- Sandbox FFmpeg and untrusted media parsing; patch pinned images through reviewed upgrades.
- Document subprocessors, deletion windows, model-provider retention settings, and regions before launch.
- Operator access to customer media requires separate auditable permission.

## 2.9 Performance targets

These are proposed acceptance budgets to benchmark, not promises already demonstrated.

- Editor shell usable within 3 seconds on a documented test machine/network after metadata load.
- Autosave debounced around 1 second; visible save confirmation or recoverable error.
- Upload throughput depends on network; show actual byte progress, not fake percentages.
- Queue wait, processing time and rendering time are measured separately.
- Establish actual 5- and 30-minute file budgets on chosen hardware before advertising speed.

## 2.10 Billing adapter rules

- Webhook verification and payment lookup are provider-specific adapters.
- Provider payloads do not directly write entitlements; normalize to verified internal payment events.
- Store amounts as integer minor units with currency and provider currency rules; never floats.
- Reserve/commit/release usage via atomic database functions.
- No raw card data stored.
- Sandbox checkout must never grant production entitlements.
- A manual bank transfer stays `pending_review` until an authorized operator reconciles a real merchant/bank record.

---

# 3. App Flow — Navigation, Upload, and User Journeys

## 3.1 Route map

```text
/                            Landing
/pricing                     Proposed plans and limits
/login                       Sign in
/signup                      Create account
/auth/callback               Auth callback handler
/forgot-password             Recovery request
/reset-password              Set new password
/onboarding                  Language and first-use setup
/app                         Redirect to projects
/app/projects                Dashboard
/app/projects/new            Upload wizard
/app/projects/:id/processing Processing and recovery
/app/projects/:id/edit       Main editor
/app/projects/:id/exports    Export list/status
/app/billing                 Usage, plan, payment history
/app/settings                Profile, language, retention/deletion
/app/help                    Support and documentation
/app/payments/return         Payment verification UI
/admin/jobs                  Restricted operations panel
```

## 3.2 Global navigation

Authenticated shell: logo/project dashboard, Projects, Billing, Help, Settings, account menu. Editor uses a focused shell with Back to projects, editable title, save state, usage link, and Export.

Unauthenticated app routes redirect to login with a validated internal return path. Do not allow open redirects. Logged-in users missing onboarding go to onboarding except payment/auth callbacks.

## 3.3 First-use journey

1. Landing “Try Editflow” -> signup.
2. Submit signup -> verification notice.
3. Verification link -> auth callback -> onboarding.
4. Choose language, accept required terms -> projects dashboard.
5. “Create first video” -> upload wizard.
6. Valid upload completes -> processing screen.
7. Processing ready -> “Open editor” and automatic transition after accessible notification.
8. Edit -> Export dialog -> export status -> Download.
9. Download success -> optional feedback prompt, never blocking.

## 3.4 Upload journey

| User action/event | System action | Next screen/state |
|---|---|---|
| Click New project | Create upload wizard, not billable processing | /app/projects/new |
| Choose/drop file | Check extension/size locally; inspect basic metadata where possible | File summary |
| Unsupported local check | Explain accepted types/limits; allow replacement | Wizard error |
| Click Upload | Create project/session; direct multipart transfer | Upload progress |
| Connection interrupted | Pause/retry parts with actual progress retained | Interrupted state |
| Resume | Reauthorize session and continue valid parts | Upload progress |
| Click Cancel upload | Confirmation; abort multipart; no processing charge | Dashboard or wizard |
| Upload complete | Server verifies object/size; enqueue inspection | Processing route |
| Actual duration exceeds limit | Reject processing; allow delete or supported upgrade | Actionable error |
| Quota insufficient | Keep uploaded asset briefly; offer billing, do not process | Processing blocked |
| Inspection passes | Reserve usage; start pipeline | Stage-by-stage status |
| Pipeline succeeds | Persist ready state and version | Editor |
| Pipeline fails | Release reservation per policy; show retry/support | Processing error |

Refreshing a page must not duplicate projects, uploads, processing, or charges. Provide a recovery link for an existing unfinished project.

## 3.5 Editor interaction behavior

- Transcript click seeks corresponding source moment mapped into current output timeline.
- Play previews current edit specification. If a change is unsaved, label preview as draft.
- Trim controls update draft ranges; validate immediately.
- Suggested-cut panel: Accept applies range update; Reject marks suggestion ignored; Undo restores prior draft.
- Caption text click opens inline editor; blur/keyboard confirmation autosaves.
- Timing controls reject negative, inverted, overlapping-invalid, or out-of-bounds times.
- Style controls update preview and local undo stack; autosave serializes bounded values.
- Aspect ratio changes require crop confirmation if content may be clipped.
- Undo/Redo operates within local session; saved draft persists latest state. Cross-session history is not promised.
- Back to projects waits for save or warns about unsaved changes.
- Export disabled while an invalid edit or unresolved save conflict exists.

## 3.6 Export journey

1. Click Export -> dialog with aspect ratio, 1080p setting, burned-caption toggle, SRT option, and final duration.
2. Confirm -> validate/save draft -> create immutable version -> create export job.
3. Route to export status page; user can leave while job runs.
4. Success -> Download MP4, Download SRT, Return to editor.
5. Failure -> explain retryable/non-retryable state; Retry uses same frozen version and idempotency rules.
6. New edits after export do not change existing output; label version and created time.
7. Expired export -> show expiry and offer re-render only if required source media still exists.

## 3.7 Billing journey

1. Billing displays actual server plan, remaining allowance, period end and renewal type.
2. Upgrade -> checkout summary from server catalog -> provider checkout.
3. Return -> “Verifying payment”; backend looks up payment or waits for verified webhook.
4. Verified success -> entitlement granted -> confirmation -> return to project.
5. Pending -> poll for bounded period; show safe resume link and reference.
6. Failed/cancelled -> no entitlement; user may restart with a new order.
7. Manual transfer -> instructions and reference -> pending review, never instant activation from evidence upload.
8. Auto-renew cancellation is offered only for providers/plans that actually auto-renew. Prepaid packs show expiry/renew buttons instead.

## 3.8 Destructive and exceptional flows

- Project deletion: dialog states media/export loss; confirm -> deletion pending -> hide from active dashboard; cleanup asynchronous.
- Account deletion: re-authenticate, explain subscription/refund implications, record request, revoke sessions and queue cleanup. Financial/legal records follow disclosed retention policy.
- Concurrent tab save: version mismatch returns 409; present Reload latest or save a local recovery copy. Never silently overwrite.
- Expired source: editor read-only with clear re-upload/new-project option. No false promise that edits can automatically reattach to unrelated media.
- Unsupported browser: status/billing usable; show editor support warning before uploading large media.

---

# 4. UI/UX Design Brief

## 4.1 Design direction

A calm, precise creative workspace. Prefer clarity and reliability over animated AI decoration. Product copy should say what happens next, what it costs, and whether content is saved.

Avoid fabricated testimonials, fake progress, “guaranteed viral” claims, and placeholder controls that look functional.

## 4.2 Visual tokens

| Token | Value | Use |
|---|---|---|
| Canvas | #0B1020 | Main app background |
| Surface | #141B2D | Panels/cards |
| Raised surface | #1C2540 | Dialogs/menus |
| Border | #334155 | Boundaries and inputs |
| Primary text | #F8FAFC | Main copy |
| Secondary text | #CBD5E1 | Supporting copy |
| Accent | #A78BFA | Primary action/focus family |
| Accent text | #160F2A | Text on light accent buttons |
| Success | #4ADE80 | Completed state |
| Warning | #FBBF24 | Pending/limit warnings |
| Error | #FB7185 | Failures |

Check actual combinations for accessible contrast; do not assume a token guarantees compliance. Error and success states include text/icons.

Typography: use an approved locally hosted sans-serif for interface and a Devanagari-capable font for mixed text; suggested candidates Inter and Noto Sans Devanagari pending license and rendering verification. Bundle the exact approved caption fonts in renderer and preview.

Scale: body 14–16px, section titles 20–24px, marketing headings 36–48px. Spacing uses 4px base. Controls minimum 40px high on desktop; touch targets increase where supported.

## 4.3 Layout and component system

- Desktop dashboard: 240px navigation, flexible content, maximum readable content widths.
- Editor: 280–340px transcript/cut panel; flexible preview; 280px properties panel; 120–180px bottom trim/timeline strip.
- At narrower widths collapse properties into a drawer; do not shrink transcript text into unreadability.
- Dialogs: clear title, impact description, primary and secondary actions.
- Shared components: buttons, fields, tooltips, tabs, segmented controls, progress stages, toast, alert, usage meter, project card, media picker, confirmation dialog.
- Every interactive component has loading, disabled, focus, error, and success behavior where relevant.

## 4.4 Screen briefs

### Landing

Concise promise, real product screenshot when available, three-step workflow, supported languages labeled accurately, CTA, pricing link, privacy/terms. No unsupported quality claims.

### Signup/login

Single-column form, accessible validation, password visibility toggle, reset link, verification guidance. No automatic marketing opt-in.

### Dashboard

Page title, New project button, remaining minutes, project cards/list with thumbnail, title, state, updated time and retention warning. Empty state contains one CTA and a small sample workflow explanation.

### Upload

Large drop zone, browse button, accepted formats, duration/size limits, language selector, privacy/retention note, selected-file summary. Progress includes uploaded bytes and pause/retry/cancel states.

### Processing

Stages: Checking file -> Preparing preview -> Transcribing -> Preparing captions -> Ready. Show actual current stage and elapsed time. Do not show made-up precision. Explain safe navigation away.

### Editor

Top bar: back, project title, save state, Undo/Redo, Export. Main area: transcript/cuts left, video center, caption/crop settings right. Bottom: simple time ruler and trim/keep ranges, not a professional multitrack imitation. Distinguish original source time from final output time where both appear.

### Export

Summary of frozen version, progress, final duration, output settings. Successful card shows file expiry and download buttons. Failure includes a request/job reference, not raw logs.

### Billing

Current plan, renewal type, allowance, billing period, next charge/expiry only when known, payment history, upgrade/cancel where supported. Annual prices clearly show total annual charge.

### Settings

Profile, language, default style, retention policy explanation, project/account deletion. Restricted security/admin controls are not mixed with ordinary settings.

## 4.5 Interaction and content rules

- Autosave states: Saving, Saved, Offline changes, Save failed, Conflict.
- Long tasks use persistent status, not a fleeting toast alone.
- Errors explain recovery. Example: “This file is longer than the 30-minute pilot limit. Upload a shorter recording.”
- Payment pending: “We have not verified this payment yet. Do not pay again unless it is marked failed.”
- Export mismatch reporting should attach version/job IDs automatically, not media without consent.
- Confirmation dialogs required for deletion and leaving with unsaved changes; not for every non-destructive edit.
- Honor reduced motion; do not autoplay audio unexpectedly.

---

# 5. Backend Schema and Authentication

## 5.1 Conventions

- PostgreSQL; UUID primary keys unless noted.
- `created_at`/`updated_at` are `timestamptz`; server-managed.
- Media times integer milliseconds; money `bigint` minor units plus ISO currency text.
- Every tenant-owned row has `workspace_id` and membership-based RLS.
- Foreign keys and mutations must prevent cross-workspace asset/project/version references through composite constraints or checked DB functions.
- Soft deletion where user-visible recovery/cleanup needs it; physical object deletion asynchronous.
- Status columns use checked text values or migrations-managed enums.
- Authentication passwords/tokens belong to managed auth, never application tables.

## 5.2 Authentication flow

1. Supabase Auth handles registration/password hashing/verification and recovery.
2. Verified signup transaction creates profile, workspace, owner membership, trial entitlement and usage period exactly once.
3. Session is validated server-side for protected actions; do not trust a browser-supplied user ID.
4. Server resolves workspace from authenticated membership, not from arbitrary request input.
5. RLS prevents unauthorized row reads even when browser API calls bypass UI.
6. Privileged service functions are narrow and audit logged.
7. Logout revokes local session; deletion flow revokes all available sessions and removes access.
8. Admin role is managed separately from workspace owner; users cannot self-promote.

## 5.3 Tables

Each table includes the full proposed MVP column set below. JSON payloads are validated with versioned schemas; they are not arbitrary untrusted blobs.

### Identity and tenancy

| Table | Columns | Relationships / constraints |
|---|---|---|
| profiles | id uuid PK, display_name text, locale text, onboarding_completed_at timestamptz null, accepted_terms_version text, accepted_terms_at timestamptz, created_at, updated_at | id -> auth.users.id; no password columns |
| workspaces | id uuid PK, name text, owner_user_id uuid, state text, created_at, updated_at, deletion_requested_at timestamptz null | owner -> profiles; state active/deletion_pending/deleted |
| workspace_members | workspace_id uuid, user_id uuid, role text, created_at | composite PK; workspace/profile FKs; owner role only provisioned through trusted flow in pilot |
| operator_roles | user_id uuid PK, role text, granted_by uuid null, created_at | operator/support role only assigned by controlled administrative process |

### Projects and media

| Table | Columns | Relationships / constraints |
|---|---|---|
| projects | id uuid PK, workspace_id uuid, created_by uuid, title text, status text, language_hint text, source_asset_id uuid null, current_version_id uuid null, processing_error_code text null, last_opened_at timestamptz null, deleted_at timestamptz null, created_at, updated_at | workspace/member authorization; source/version FK added after base tables to resolve cycle |
| media_assets | id uuid PK, workspace_id uuid, project_id uuid, kind text, storage_bucket text, object_key text, original_filename text null, mime_type text null, bytes bigint, duration_ms bigint null, width int null, height int null, fps_num int null, fps_den int null, video_codec text null, audio_codec text null, checksum_sha256 text null, status text, expires_at timestamptz null, deleted_at timestamptz null, created_at, updated_at | kinds source/proxy/audio/export/subtitle; unique bucket+key; positive sizes/dimensions where present |
| upload_sessions | id uuid PK, workspace_id uuid, project_id uuid, asset_id uuid, storage_upload_id text, expected_bytes bigint, uploaded_bytes bigint, state text, expires_at timestamptz, completed_at timestamptz null, idempotency_key text, created_at, updated_at | unique workspace+idempotency_key; actual storage parts authoritative |
| upload_parts | upload_session_id uuid, part_number int, etag text, bytes bigint, created_at | composite PK; no browser trust for unverified completion |

### Transcripts, captions, and edits

| Table | Columns | Relationships / constraints |
|---|---|---|
| transcripts | id uuid PK, workspace_id uuid, project_id uuid, asset_id uuid, provider text, model text, operation_version text, language_result text null, status text, confidence_summary jsonb null, created_at, updated_at | one active successful operation per source/model operation key; raw provider payload not stored by default |
| transcript_words | id uuid PK, workspace_id uuid, transcript_id uuid, word_index int, text text, start_ms int, end_ms int, confidence real null | unique transcript+word_index; 0 <= start < end; preserve original recognized text |
| caption_tracks | id uuid PK, workspace_id uuid, project_id uuid, transcript_id uuid, revision bigint, locale text, created_at, updated_at | revision optimistic locking; source-time caption track |
| caption_segments | id uuid PK, workspace_id uuid, track_id uuid, sequence int, start_ms int, end_ms int, text text, word_overrides jsonb null, created_at, updated_at | unique track+sequence; bounded source timing; validated word overrides |
| cut_suggestions | id uuid PK, workspace_id uuid, project_id uuid, asset_id uuid, start_ms int, end_ms int, reason text, detector_version text, decision text, created_at, updated_at | decision pending/accepted/rejected; source-time ranges |
| project_drafts | project_id uuid PK, workspace_id uuid, revision bigint, edit_spec jsonb, updated_by uuid, created_at, updated_at | one draft per project; compare-and-swap revision updates |
| project_versions | id uuid PK, workspace_id uuid, project_id uuid, version_number int, edit_spec jsonb, caption_snapshot jsonb, content_hash text, created_by uuid, created_at | immutable; unique project+version_number and project+content_hash |
| style_presets | id uuid PK, workspace_id uuid, name text, style_schema_version int, style jsonb, created_by uuid, created_at, updated_at, deleted_at timestamptz null | approved font IDs/bounded fields; no arbitrary CSS/HTML |

### Jobs and exports

| Table | Columns | Relationships / constraints |
|---|---|---|
| processing_jobs | id uuid PK, workspace_id uuid, project_id uuid, export_id uuid null, type text, status text, stage text null, progress_pct int null, attempt_count int, max_attempts int, idempotency_key text, provider_request_id text null, error_code text null, error_message_safe text null, lease_until timestamptz null, heartbeat_at timestamptz null, started_at timestamptz null, completed_at timestamptz null, cancel_requested_at timestamptz null, created_at, updated_at | unique workspace+idempotency_key; progress 0..100 when meaningful |
| exports | id uuid PK, workspace_id uuid, project_id uuid, version_id uuid, status text, settings jsonb, output_asset_id uuid null, subtitle_asset_id uuid null, duration_ms int null, expires_at timestamptz null, created_by uuid, created_at, updated_at | immutable version input; publish assets only after validation |
| outbox_events | id uuid PK, workspace_id uuid null, event_type text, aggregate_id uuid, payload jsonb, dedupe_key text, published_at timestamptz null, attempts int, created_at | unique dedupe_key; server/worker only; transactional queue delivery |
| job_costs | id uuid PK, workspace_id uuid, job_id uuid, category text, provider text null, quantity numeric, unit text, estimated_cost_microusd bigint null, actual_cost_microusd bigint null, created_at | server-only; retain no content payload |

### Billing and usage

| Table | Columns | Relationships / constraints |
|---|---|---|
| plans | id text PK, version int, display_name text, active boolean, entitlements jsonb, created_at | immutable published plan-version rows; use ID such as creator_v1 |
| plan_prices | id uuid PK, plan_id text, currency text, amount_minor bigint, billing_mode text, interval text null, provider text, provider_price_id text null, active boolean, created_at | billing_mode recurring/prepaid/trial; interval month/year/null; no client prices |
| billing_customers | id uuid PK, workspace_id uuid, provider text, provider_customer_id text, environment text, created_at | unique provider+environment+customer; server-only identifiers |
| orders | id uuid PK, workspace_id uuid, price_id uuid, provider text, environment text, amount_minor bigint, currency text, status text, provider_reference text null, idempotency_key text, expires_at timestamptz null, verified_at timestamptz null, created_at, updated_at | immutable price snapshot; unique workspace+idempotency_key; pending/review/paid/failed/cancelled/refunded |
| payment_events | id uuid PK, provider text, environment text, provider_event_id text, order_id uuid null, event_type text, verification_state text, payload_redacted jsonb, received_at timestamptz, processed_at timestamptz null, error_code text null | unique provider+environment+provider_event_id; server only; signed/verified before application |
| subscriptions | id uuid PK, workspace_id uuid, plan_id text, provider text, environment text, provider_subscription_id text, status text, current_period_start timestamptz, current_period_end timestamptz, cancel_at_period_end boolean, cancelled_at timestamptz null, created_at, updated_at | recurring providers only; unique provider+environment+subscription ID |
| entitlement_grants | id uuid PK, workspace_id uuid, plan_id text, source_type text, source_id uuid null, source_key text, starts_at timestamptz, ends_at timestamptz, entitlements_snapshot jsonb, state text, created_at | source trial/order/subscription/manual; unique source_key prevents double activation |
| usage_periods | id uuid PK, workspace_id uuid, grant_id uuid, starts_at timestamptz, ends_at timestamptz, included_seconds bigint, committed_seconds bigint, reserved_seconds bigint, created_at, updated_at | nonnegative counters; atomic checked functions prevent overspend |
| usage_ledger | id uuid PK, workspace_id uuid, period_id uuid, asset_id uuid null, job_id uuid null, operation_key text, entry_type text, seconds bigint, idempotency_key text, created_at | entry reserve/commit/release/adjust; positive seconds; unique idempotency key; append-only |
| manual_payment_reviews | id uuid PK, workspace_id uuid, order_id uuid, submitted_reference text, state text, reviewed_by uuid null, reviewed_at timestamptz null, decision_reason text null, created_at, updated_at | pending/approved/rejected; approval via trusted reconciliation, not screenshot inference |

### Operations and privacy

| Table | Columns | Relationships / constraints |
|---|---|---|
| audit_events | id uuid PK, workspace_id uuid null, actor_user_id uuid null, actor_type text, action text, target_type text, target_id uuid null, metadata_redacted jsonb, request_id text null, created_at | append-only server writes; no full media URLs/transcripts |
| deletion_requests | id uuid PK, workspace_id uuid, requested_by uuid, scope text, target_id uuid, state text, requested_at timestamptz, completed_at timestamptz null, error_code text null | project/account scopes; idempotent cleanup; legal financial retention exceptions |
| feedback_reports | id uuid PK, workspace_id uuid, user_id uuid, project_id uuid null, export_id uuid null, category text, message text, consent_to_inspect_media boolean, created_at | consent defaults false; bounded message length; support access audited |

## 5.4 Core relationships

```text
Auth user -> Profile -> Workspace membership -> Workspace
Workspace -> Projects -> Media assets / Transcripts / Caption tracks
Transcript -> Words
Caption track -> Caption segments
Project -> Draft -> Immutable project versions -> Exports
Project -> Cut suggestions / Processing jobs
Workspace -> Orders / Subscriptions -> Entitlement grants -> Usage periods
Usage periods -> Append-only usage ledger
Payment events -> Verified orders -> Idempotent grants
```

## 5.5 Indexes and constraints

- Membership `(user_id, workspace_id)` and tenant-table workspace indexes.
- Projects `(workspace_id, updated_at DESC)` filtered to nondeleted rows.
- Jobs `(status, created_at)`, `(workspace_id, status)`, heartbeat/lease index.
- Captions `(track_id, sequence)` and words `(transcript_id, word_index)`.
- Exports `(project_id, created_at DESC)` and retention indexes on assets/exports.
- Unique provider IDs/events and all operation idempotency keys.
- Usage updates run in a transaction locking the relevant usage period.
- No payment, plan, entitlement, usage, cost, or audit writes from browser role.
- Immutable version rows reject updates through DB policy/function controls.
- Deletion uses controlled jobs; do not cascade away financial records accidentally.

## 5.6 RLS matrix

| Data | Member read | Member direct write | Trusted backend/worker |
|---|---|---|---|
| Own profile | Yes | Limited profile fields | Provision/deletion |
| Workspace/projects | Yes | No privileged fields | Checked API mutations |
| Draft/captions | Yes | Through validated API only | Revision-safe updates |
| Versions/exports | Yes | No | Snapshot/render lifecycle |
| Jobs | Sanitized view | No | Lifecycle updates |
| Usage/entitlements | Sanitized summary | No | Atomic billing functions |
| Orders | Own summary | No | Verification only |
| Payment events/costs/outbox | No | No | Server only |
| Audit/operator roles | No ordinary member access | No | Restricted operator service |

## 5.7 Retention and backups

- Initial proposal: source/proxy/audio expire 30 days after upload; exports/SRT expire seven days after creation.
- Expiring media makes projects read-only unless policy explicitly supports paid extension later.
- Purge runs daily with retry; download access blocked immediately when deletion requested.
- Delete temporary worker files after every job, including failure paths.
- Backup retention and financial retention must be configured and disclosed before launch; deletion may age out through backup rotation rather than instantaneous removal.
- Test database restoration and object recovery assumptions before accepting paid production work.

---

# 6. Implementation Plan

## 6.1 Agent operating instructions

- Implement one phase at a time. Do not skip failing gates to add visible features.
- Before each phase, list files, migrations, tests and expected behavior.
- Use actual installed package/API versions; pin dependencies and verify official docs.
- Never invent provider endpoints, bank APIs, webhook signatures, or payment credentials.
- Never run destructive production migrations or send real charges without explicit owner approval.
- Keep secrets in environment/secret store, never source control or logs.
- No paid feature may silently fall back to unverified activation.
- If a dependency is blocked, expose a clearly labeled disabled state rather than fake success.

## 6.2 Build sequence and gates

### Phase 0 — Product validation and technical spikes

Tasks:
1. Confirm product owner decisions in the open-questions list.
2. Recruit five paid-pilot candidates.
3. Build a consented media evaluation set.
4. Compare transcription and alignment providers on that set.
5. Prove Devanagari rendering in browser and FFmpeg output.
6. Benchmark one 5-minute and one 30-minute render on proposed infrastructure.
7. Confirm merchant/supplier onboarding path and sandbox access.

Deliverables: benchmark notes, cost sheet, approved fonts, decision log.  
Gate: feasible upload-to-export pipeline and evidence of paid interest. If mixed-language performance fails, launch English-only or stop—not a false language claim.

### Phase 1 — Repository and environments

1. Create monorepo structure and pinned toolchain.
2. Add lint/typecheck/test commands and CI.
3. Create local Docker dependencies and sample environment file without secrets.
4. Define shared Zod contracts and worker JSON Schema.
5. Create staging and production separation.

Gate: clean checkout can run documented setup and CI checks.

### Phase 2 — Identity and data foundation

1. Create identity/workspace migrations.
2. Implement signup, verification, login, recovery and logout.
3. Add onboarding transaction and trial grant.
4. Add RLS policies and cross-tenant tests.
5. Add protected layout and dashboard empty state.

Gate: user A cannot access user B's resources through UI, direct API or database client.

### Phase 3 — Media upload and inspection

1. Add projects, assets and upload tables.
2. Implement direct multipart upload.
3. Add resume/cancel and stale-upload cleanup.
4. Implement dispatcher/outbox and worker lease.
5. Add ffprobe inspection, duration validation and proxy generation.
6. Add processing page and truthful progress stages.

Gate: interruption recovery works; invalid/oversized media rejected; source never publicly accessible.

### Phase 4 — Usage accounting and transcription

1. Implement plans, entitlements, usage periods and ledger.
2. Add atomic reserve/commit/release functions.
3. Implement transcription provider adapter.
4. Add alignment adapter and normalized source-time words.
5. Create caption segments and conservative silence candidates.
6. Retry safely; persist valid intermediate results.

Gate: successful job consumes once; failed/cancelled jobs reconcile correctly; no negative balances or double commits.

### Phase 5 — Editor

1. Build transcript pane and proxy playback.
2. Implement draft specification and optimistic revision saves.
3. Add text/timing correction.
4. Add trim, cut acceptance/rejection, undo/redo.
5. Add crop and aspect ratio.
6. Add curated caption styles and local font coverage.
7. Implement source/output timeline mapping unit tests.

Gate: fixture edits survive refresh; save conflicts are safe; all timing transforms deterministic.

### Phase 6 — Export

1. Freeze immutable version with caption snapshot.
2. Compile FFmpeg instructions and SRT from shared edit semantics.
3. Render with time/resource limits.
4. Inspect output before publication.
5. Implement downloads and expiry.
6. Add failure recovery and same-version retry.

Gate: preview/export agreement on benchmark fixtures; Unicode captions render; download permissions and expiry enforced.

### Phase 7 — Payments

1. Implement provider-neutral order and verified-event pipeline.
2. Add approved international sandbox adapter.
3. Add Khalti sandbox adapter if merchant access exists.
4. Verify callbacks via official backend contracts and signatures where supported.
5. Add dedupe, amount/currency/order checks and reconciliation.
6. Add prepaid grant logic and recurring subscription sync only where supported.
7. Add billing/cancellation UI appropriate to actual billing mode.
8. Add controlled manual-review workflow if needed.

Gate: replayed events cannot double-grant; forged returns cannot grant; sandbox cannot activate production; failure/pending/refund states tested.

### Phase 8 — Privacy and operational hardening

1. Implement project/account deletion.
2. Add retention cleanup.
3. Add scrubbed monitoring and cost tracking.
4. Test restore procedures.
5. Test malicious inputs, limits and authorization.
6. Prepare support, incident and failed-job runbooks.
7. Complete terms/privacy/refund, licensing and onboarding review.

Gate: no critical unresolved security issue; production spend caps and alerts enabled.

### Phase 9 — Private pilot

1. Onboard 5–10 paying users personally.
2. Measure complete workflow time and correction work.
3. Triage export/caption defects before new features.
4. Review delivery cost and support burden weekly.
5. Collect permissioned case studies and cancellation feedback.

Gate: repeat paid usage, reliable exports and sustainable costs. Otherwise narrow or pause.

### Phase 10 — Controlled launch

1. Publish accurate pricing, supported languages and limits.
2. Add referral tracking without sensitive content.
3. Launch focused tutorials/demos.
4. Increase concurrency only after load testing.
5. Revisit annual plans after renewal/retention signals.

## 6.3 Suggested 90-day allocation

- Days 1–14: Phase 0.
- Days 15–30: Phases 1–3.
- Days 31–45: Phases 4–5.
- Days 46–60: Phase 6 and start approved payment integration.
- Days 61–75: Phases 7–8 and private pilot.
- Days 76–90: Phase 9, then limited Phase 10 if gates pass.

This assumes sustained engineering capacity. For a part-time student founder, reduce scope or extend dates rather than bypassing gates.

## 6.4 Required test matrix

| Area | Required cases |
|---|---|
| Auth | Expired sessions, unverified email, recovery, cross-tenant reads/writes |
| Upload | Interrupted transfer, expired session, corrupt file, wrong extension, huge metadata values |
| Media | Rotation, variable frame rate, silent audio, no audio, noisy audio, unusual dimensions |
| Captions | English, Devanagari, mixed script, punctuation, long words, names, right/left boundary cuts |
| Edits | All footage removed rejection, overlapping cuts, zero-length range, boundary rounding |
| Save | Refresh, offline edits, concurrent tabs, revision conflict |
| Export | Worker crash, duplicate job, cancelled job, missing font, disk full, expired source |
| Billing | Forged callback, replay, pending status, wrong amount/currency, refund, late webhook |
| Usage | Simultaneous reservations, retry, cancellation, no duplicate commitment |
| Privacy | Signed URL expiry, deleted asset access, logs contain no content, tenant isolation |
| Retention | Expiry warning, purge retry, read-only project after source expiry |

## 6.5 Definition of done

A feature is complete only when:

- Acceptance criteria and tests pass.
- Authorization and error states are implemented.
- No placeholder success response remains.
- Sensitive content is absent from logs.
- Loading/empty/offline/error states are usable.
- Schema migration and rollback/forward-fix strategy documented.
- Cost and entitlement implications recorded.
- User-visible behavior matches this specification or an approved decision record.

## 6.6 Open questions requiring owner confirmation

1. Is the first paid customer an individual creator or agency owner?
2. What development budget and weekly engineering time are available?
3. Which exact mixed-language pair has enough permissioned test footage?
4. Which provider can supply reliable transcription plus timing within budget?
5. Can the founder obtain merchant and international supplier approval?
6. Which legal entity, settlement account, and accounting process will be used?
7. Are the proposed retention windows commercially acceptable?
8. Should trial output be watermarked? Default recommendation: small sample allowance with at least one usable export.
9. Which fonts pass license, script shaping, preview and renderer tests?
10. Are annual billing and local prepaid packs necessary at first launch? Default: defer annual contracts until reliability is proven.

## 6.7 Evidence links and verification register

These links informed the preceding market discussion. They are not substitutes for implementation-time API documentation or legal/commercial approval.

- Descript feature/pricing baseline: https://www.descript.com/pricing
- OpusClip pricing baseline: https://www.opusclip.io/pricing
- Kapwing pricing baseline: https://www.kapwing.com/pricing
- Customer export/control feedback: https://www.producthunt.com/products/submagic/reviews
- Captions customer credit/correction feedback: https://apps.apple.com/us/app/captions-ai-edits-your-video/id1541407007?see-all=reviews
- Khalti web checkout and lookup: https://docs.khalti.com/khalti-epayment/
- eSewa merchant documentation: https://developer.esewa.com.np/pages/Epay
- MBL connectIPS merchant gateway information: https://www.machbank.com/products/smart-services/connect-ips/
- MBL merchant QR information: https://www.machbank.com/products/smart-services/qr-payment/
- Paddle supplier country eligibility overview: https://www.paddle.com/help/start/intro-to-paddle/which-countries-are-supported-by-paddle
- Stripe availability: https://stripe.com/global
- OpenAI API pricing, recheck at build time: https://developers.openai.com/api/docs/pricing

Record verification date, owner, sandbox result, production approval, and relevant terms in an architecture decision record before enabling each integration.

---

End of blueprint. Build the smallest complete, trustworthy workflow first. Validate quality, repeat usage and margins before expanding scope.
