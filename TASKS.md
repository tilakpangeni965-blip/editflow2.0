# ShikshyaStudio Tasks

This is an audit roadmap from repository source at `main` commit `373e1ff893cca5584a0ed7dd8f266c39a8348855` (2026-11-01). **No tasks below are marked complete.** Check `SECURITY.md` for evidence and safe testing notes. Do not change production settings/data without explicit approval.

## P0 — Critical: block unauthorized access and false paid entitlements

- [ ] Remove/disable legacy demo token auth (`shikshya-token-*`) and unauthenticated email-only login/signup in production; make Firebase verification failure fail closed.
- [ ] Remove unauthenticated/constant-code email verification fallbacks; bind verification to the authenticated Firebase identity.
- [ ] Disable eSewa/Khalti fake-success fallbacks and any path that activates subscriptions without authoritative payment confirmation.
- [ ] Stop returning activation OTPs to the browser; remove the universal demo OTP and replace with an authorized delivery process only after real settlement verification.
- [ ] Fix the runtime-breaking unimported `neq` calls in `src/db/users.ts`, then review payment and OTP queries for correct owner/payment/purpose binding, expiry, attempt limits and state transitions.
- [ ] Make payment verification and subscription activation transactional and idempotent; cover duplicate and concurrent callbacks.
- [ ] Verify all paid APIs read subscription entitlement from the database and reject pending/expired/cancelled plans. Audit all paid feature routes, not only exam-pack endpoint.
- [ ] Add adversarial tests for invalid tokens, cross-account data access, forged UTR/gateway response, universal OTP, duplicate payment, and unauthorized subscription activation.

## P1 — High: protect user files, downloads, database and output

- [ ] Remove hardcoded `HMAC_SECRET` fallback and fail closed on missing managed secret; ensure signed download access is owner/resource-bound and resists link leakage/forgery.
- [ ] Escape HTML export title and content in `/api/ai/export`; verify malicious markup is inert.
- [ ] Move media storage from ephemeral/local disk to durable private storage before production reliance; define access control, ownership, cleanup, retention and deletion.
- [ ] Add strict upload content-type/signature checks, supported codecs/extensions, quotas, parser constraints, reliable cleanup and rate limiting.
- [ ] Confirm Cloud SQL network encryption/TLS, least-privilege credentials, database grants, backups, restore testing and production filesystem persistence with platform configuration evidence.
- [ ] Add reviewed, reproducible database migrations; test against a disposable/staging database and document rollback. Do not push schema changes directly to live DB.
- [ ] Audit signed-link download behavior including external redirects, token leakage, expiry and project deletion/revocation.

## P2 — Medium: clarify AI and media behavior and harden reliability

- [ ] Clearly distinguish demo media, seeded captions and fallback exam packs from output generated from the user's file.
- [ ] Decide whether to implement transcription; document chosen service, formats, duration/size limits, privacy, retries, progress and exports only after implementation exists.
- [ ] Decide whether to build actual audio cleanup/video rendering; current controls update project metadata but no media transform is present.
- [ ] Make AI quota reservation/charging consistent with successful/failed Gemini calls; add input bounds, provider timeouts and abuse limits.
- [ ] Make Gemini fallback state visible and truthful rather than returning indistinguishable success; preserve useful failure diagnostics without leaking sensitive details.
- [ ] Replace persisted localStorage bearer token use with current Firebase SDK token retrieval where feasible; review XSS/CSP and stale token behavior.
- [ ] Add integration tests for project/AI/document/payment APIs using two isolated test accounts and fake provider fixtures.

## P3 — UI, content and accessibility

- [ ] Reconcile landing page and footer claims about private buckets, HMAC links, silence removal, normalization, bilingual captions, bank settlement and payment providers with actual production capabilities.
- [ ] Label sample/demo accounts, sample external video, seeded projects and demo transactions so they cannot be mistaken for real user feedback or processing output.
- [ ] Verify any testimonials, ratings or usage statistics have genuine evidence; do not remove genuine feedback without checking provenance.
- [ ] Review ShikshyaStudio/Editflow naming consistency, favicon/logo assets, responsive behavior, light/dark themes, keyboard flow, modal semantics, contrast and mobile layouts.
- [ ] Review form validation, empty/loading/error states and notifications for truthful user feedback.

## P4 — Operations and future improvements

- [ ] Verify active AI Studio/Cloud Run deployment, service URL/custom domain, build/start command, runtime identity, secret mappings and logs with authorized operator access.
- [ ] Verify Firebase project/provider configuration, authorized domains, Secure Token API health and current error logs; previous reported expired-token and project-number error are not confirmed by source alone.
- [ ] Add documented local setup, environment-variable reference (names only), staging process, test commands, database migration/backup/restore and safe deployment runbook.
- [ ] Add tests for Bun lockfile install, TypeScript lint, Vite build and backend endpoint behavior in CI.
- [ ] Decide data retention, account deletion, project/media export and privacy disclosures; implement only after requirements and production data impact are reviewed.

## Audit completion record

- [x] Source tree and key application/backend/config paths inspected via GitHub at the pinned `main` commit.
- [x] Findings and unknowns written into project context, architecture, security and development log.
- [ ] No code-level remediation has been started or approved.
- [ ] No build, typecheck, tests or live-system verification has been performed for this inspection-only audit.