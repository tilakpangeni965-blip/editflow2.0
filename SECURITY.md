# ShikshyaStudio Security Audit

**Audit scope:** Repository source at `main` commit `373e1ff893cca5584a0ed7dd8f266c39a8348855`, 2026-11-01. No live Firebase/Cloud Run/PostgreSQL/gateway environment, secrets, DNS, or logs were accessed. Severity reflects likely impact if these routes are deployed as written; confirm exposure before incident response. This review is not a certification or legal-compliance assessment.

## Findings

### Critical — legacy demo tokens provide an authentication bypass

**Evidence:** `server.ts` exposes unauthenticated `/api/auth/login` and `/api/auth/signup`, which create profiles and issue `shikshya-token-*` values. Login requires only an email, not a password. `src/middleware/auth.ts` explicitly accepts that token prefix without Firebase verification. `src/context/AuthContext.tsx` falls back to `/api/auth/login` after Firebase email sign-in errors. Other protected routes use `requireAuth`, so this demo route can potentially become an authenticated identity for APIs.

**Impact:** An unauthenticated caller may impersonate/create accounts and access user-bound functionality. Email verification routes are also unauthenticated; a constant code path is accepted. Public exposure is not confirmed from source alone.

**Recommendation:** Before public/paid use, remove or hard-disable demo-token acceptance and unauthenticated legacy auth routes in production; fail closed if Firebase verification fails. Ensure email verification is bound to a server-authenticated account and use Firebase's verified state. Add abuse/rate limits. Do not fix without approval (current audit-only scope).

### Critical — payment success can be fabricated; payment data lookup predicates need urgent review

**Evidence:** `server.ts` `/api/payments/verify-esewa` and `/verify-khalti` return `success: true, verified: true` in catch fallbacks even when activation fails; no provider verification request appears. MBL endpoint passes user-supplied UTR into `verifyBankSettlementAndIssueOtp`; `src/db/users.ts` checks only UTR string length and does not contact a bank. It returns `rawOtp` in JSON (`otpIssued`). The DB helper also accepts universal OTP `123456`. `src/db/users.ts` imports `eq, and, desc` from Drizzle but the payment/OTP lookup functions call `neq(...)`, which is not imported or defined in that module. These paths will throw a `ReferenceError` when executed (unless an unobserved global binding exists, which is not expected in modules), so settlement/OTP verification is broken as written. The surrounding intended filters appear to compare transaction/payment/user identity; review them when correcting the runtime error.

**Impact:** API responses can claim unverified payments; clients may be shown false paid status. OTP is disclosed to the requestor. Flawed query conditions can prevent correct owner/payment matching or select unintended records. The UI additionally contains simulated gateway credentials/OTP values (see `PricingBillingModal.tsx`).

**Recommendation:** Disable payment activation endpoints until fixed. Verify amount, currency, merchant, reference, status and idempotency against official provider/bank verification or signed webhook; no screenshot/UTR alone is proof. Remove demo OTP and all success fallbacks. Keep pending/verified/rejected/expired separate, bind OTP to owner/payment/purpose, enforce attempt/expiry limits, and perform payment + subscription state transitions transactionally with concurrency-safe idempotency. Reconcile transaction predicates and add adversarial tests. Never use the visible account/payment UI values as real payment instructions absent independent confirmation.

### High — unsafe default HMAC secret and weak signed-download authorization

**Evidence:** `server.ts` uses a predictable hardcoded default when `HMAC_SECRET` is unset. Link generation returns the raw token and signature. The signed download endpoint verifies expiration/signature but does not independently authenticate the requester or re-check the user's ownership; link possession is the only access gate. The generated payload does not include user ID, and a valid link redirects to external media URLs where applicable.

**Impact:** Anyone obtaining/guessing a link, or using the default signing key to forge one, may access project-derived downloads. The specific behavior depends on deployment secret configuration and URL disclosure.

**Recommendation:** Require a high-entropy secret from a managed secret store and fail startup when absent. Bind signed links to owner and narrowly allowed resource, minimize returned token material, consider authenticated downloads, use constant-time signature comparison, and add caching/referrer controls. Ensure the final media object itself is private and durable.

### High — sample/fallback media pipeline can mislead users and lose real uploads

**Evidence:** `UploadModal.tsx` uses a public sample video URL by default and continues with it after upload failure. Project creation in `server.ts` hardcodes silence ranges and example captions/lesson pack; no transcoder, transcription service, or cloud object store exists in the repository. Media upload uses local disk paths (`uploads/media`) and broad `audio/*` or `video/*` MIME checks; database project path includes a URL that may point externally. No cleanup/retention lifecycle is visible.

**Impact:** User may believe actual media has been processed/transcribed when it has not; media can be lost after instance replacement or storage exhaustion. Untrusted uploads can consume disk or exploit parsers/downstream tooling; MIME alone does not establish content type.

**Recommendation:** Clearly label demo behavior, do not claim transcription or transformed exports until real pipeline exists. For production, use durable private object storage, strict file/codec allowlists and content inspection, quota/length limits, malware scanning if appropriate, cleanup/retention policy, and server-generated ownership-bound object references. Test failure and retry paths.

### High — no documented production data protection or backup configuration

**Evidence:** PostgreSQL access is via `pg`/Drizzle, but repository contains no database grants/RLS policies, backup schedule, restore guide, or migration artifacts. `src/db/drizzle.config.ts` sets `ssl: false`. This does not prove transport is unencrypted in production; environment/network configuration is unavailable.

**Impact:** Misconfigured remote database transport/permissions or unavailable backup/restore can expose or permanently lose user records.

**Recommendation:** Verify production network/TLS and least-privilege DB users with the operator; use encrypted transport when supported. Establish tested automated backups, retention, point-in-time recovery if available, and documented restore drills before schema operations. Use reviewed migrations and staging for future changes.

### High — export HTML interpolates user-provided content without escaping

**Evidence:** `/api/ai/export` constructs HTML using raw `title`, `content` and paragraph text, then sends it as a Word-compatible HTML document. Authentication does not neutralize stored or downloaded HTML.

**Impact:** Exported document may execute or carry malicious markup when opened/rendered in a browser or other HTML-capable viewer; content can also corrupt layout.

**Recommendation:** HTML-escape title and text before markup generation, or use a safe document serializer. Add tests with script/tag/attribute payloads.

### Medium — client stores bearer tokens in localStorage and uses stale-token fallback

**Evidence:** `src/context/AuthContext.tsx` persists ID token to `localStorage`, retrieves it at startup, and only refreshes via `getIdToken()` when Firebase auth-state callback runs. A failed Firebase login may replace it with demo token. Firebase SDK can manage its own session; storing a bearer token increases XSS impact.

**Impact:** Any successful same-origin script injection can read a persisted token. A stale token can produce the reported expired-token error; source does not confirm the reported Secure Token API error.

**Recommendation:** Prefer Firebase SDK's current-token retrieval (`getIdToken` when making API requests) rather than a long-lived copy; remove demo fallback. Review CSP, XSS risks and Firebase persistence/provider/domain settings in Firebase console. Do not change auth domains/settings without approval.

### Medium — AI usage may be charged before successful completion; fallback hides AI errors

**Evidence:** `/api/ai/edit` calls `checkAndRecordAiUsage` before Gemini execution; failures can still record usage. Exam-pack route returns HTTP JSON success with old content after Gemini errors. No rate limiting is apparent in the server route setup.

**Impact:** Users can lose quota on failed requests; operational failures may appear as successful but unchanged content. Public endpoints may be abused to consume API budget.

**Recommendation:** Reserve/commit usage atomically or compensate on failure; return explicit fallback/source status and do not imply fresh AI output. Add per-user/IP request limits, input size caps and provider timeouts. Keep provider key server-side.

### Medium — document upload size/type and cleanup controls are incomplete

**Evidence:** Document endpoint permits up to 25 MiB and delegates format largely by original filename extension. It stores files temporarily on local disk; cleanup is attempted after parse. Media endpoint permits 100 MiB. No throttling, storage quotas, parser isolation or content validation is evident.

**Impact:** Malicious or malformed files may consume resources or target parsers; failed cleanup can leave sensitive documents on disk.

**Recommendation:** Validate actual file signatures and allowed types, limit pages/text/extraction duration, isolate parsers, reliably delete temp files in `finally`, add quotas/rate limits, and verify filesystem permissions/ephemeral disk behavior.

### Low — demo identities and marketing claims are mixed with real-looking service claims

**Evidence:** `src/utils/sampleData.ts` seeds named sample users/projects and external sample media; landing FAQs claim bank checks, private buckets and HMAC guarantees without corresponding verified implementation. Footer lists payment providers. No evidence confirms the displayed testimonials/ratings/stats; full UI content was not exhaustively verified.

**Impact:** Users may mistake demo data or unsupported claims for real customers/security/payment capabilities.

**Recommendation:** Label demo data and verify every public statement against production behavior; retain genuine feedback only when provenance is established. No marketing content was changed in this audit.

## Authentication and authorization invariants for future work

- Verify Firebase ID tokens server-side; derive user ID only from verified UID, never request-body IDs.
- Scope every project, history, payment and file query to that UID. Test cross-user reads/writes/deletes.
- Never accept `shikshya-token-*` or client-controlled plan/verification state in production.
- Treat client state/localStorage as display-only. Paid entitlement must be read and enforced server-side.
- Validate same-origin/CSRF and use secure transport. This API currently uses bearer headers and no cookie session is evident; validate CORS/origin behavior in deployment.

## Secrets and safe operations

- Never commit `.env`, database passwords, Firebase service-account JSON/private keys, HMAC secret, or Gemini API key. `.env.example` contains placeholders only; use platform secret management.
- Firebase web config values are client-visible identifiers, not substitutes for server credentials. The Firebase project number in source is non-secret but included in `firebase-applet-config.json`; do not publish private keys.
- `HMAC_SECRET` must not use the source fallback. Do not print secret values to logs/docs/chat.
- Use local/staging credentials and test payments only; never call actual bank/gateway endpoints or alter live subscriptions during tests.
- Do not run Drizzle push/migrations against production without explicit approval, reviewed migration/backups and a rollback plan.
- Do not deploy or change Cloud Run, Firebase authorized domains, OAuth providers, DNS, payment merchant config or production database without explicit approval.

## Recommended safe verification

1. In a disposable local/staging environment, verify the unauthenticated legacy auth paths fail closed and Firebase invalid/expired tokens return 401.
2. With two test accounts, verify each cannot read/update/delete the other's project/history/payment/download.
3. Use fake gateway fixtures only; assert failed/unverified provider responses cannot activate a subscription or issue a usable OTP. Test duplicate callbacks/races.
4. Upload benign and malformed files of allowed/disallowed types; confirm size, parser limits, cleanup and no public object exposure.
5. Test HTML export with script/tag payloads and verify output is escaped.
6. Force Gemini timeouts and confirm quota behavior and honest UI error/fallback reporting.
7. Confirm staging database TLS, least privilege, backup/restore and Cloud Run local-disk assumptions with configuration evidence.

No application code, credentials, production settings, database records or deployments were changed in this audit.