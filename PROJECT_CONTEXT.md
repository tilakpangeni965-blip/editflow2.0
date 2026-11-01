# ShikshyaStudio Project Context

**Audit snapshot:** GitHub `main` at `373e1ff893cca5584a0ed7dd8f266c39a8348855` (2026-11-01). This file describes repository evidence only; production services were not accessed. Treat code/configuration as authoritative if this document becomes stale.

## Purpose and verified scope

The repository has inconsistent product labels: `index.html` uses ShikshyaStudio Nepal, while the app/footer and Gemini editing prompt also use Editflow/शिक्षा स्टुडियो नेपाल. It is a React app aimed at Nepali teachers, content creators and coaching institutes. The implemented UI combines account/profile and billing screens, a lecture-project workbench, local browser audio inspection, a subtitle editor, exam-pack views, and a text AI editing workspace. Important qualification: the visible media workflow is not a verified end-to-end video/audio processing or transcription service. Sample media, seeded subtitle/lesson-pack data, simulated progress and fallback responses appear in the project creation flow.

## Architecture

- **Frontend:** React 19 + TypeScript, Vite 8, Tailwind CSS 4 via Vite plugin, lucide-react icons. `src/main.tsx` mounts `src/App.tsx`; there is no router dependency visible: `App.tsx` switches views using local React state. `AuthContext`, `LanguageContext`, and `ThemeContext` provide app-wide state.
- **Backend:** Express 4 + TypeScript (`server.ts`, run with `tsx`). It mounts `/api/*` routes and either Vite middleware for development or serves `dist` in production.
- **Database:** PostgreSQL through `pg` and Drizzle ORM. `src/db/schema.ts` defines profiles, subscriptions, payments, OTPs, projects, editing history, and AI usage records. Database connectivity uses `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, and `SQL_DB_NAME`.
- **Identity:** Firebase Authentication client SDK (`src/lib/firebase.ts`) supports Google popup and email/password. Server middleware (`src/middleware/auth.ts`) verifies Firebase ID tokens using Firebase Admin (`src/lib/firebase-admin.ts`) and syncs user profiles into PostgreSQL. Demo-token and legacy auth routes also exist and must not be considered production-safe.
- **AI:** `src/services/aiEditorService.ts` uses `@google/genai` with server-side `GEMINI_API_KEY`. `server.ts` also generates exam packs with Gemini.
- **Files/documents:** Multer writes media and temporary documents under local `uploads/`; document extraction supports TXT/MD/CSV, DOCX and PDF through `src/services/documentExtractor.ts`. The project media DB rows include URLs, but no cloud object-storage integration is visible in this tree.

## Main paths

- `server.ts` — Express routes, uploads, auth/payment flows, Gemini endpoints, downloads, startup/static serving.
- `src/App.tsx` — app-level view and modal composition.
- `src/components/` — UI: `LandingPage`, `Navbar`, `ProjectList`, `Workbench`, `UploadModal`, `SubtitleEditorView`, `AudioProcessorView`, `ExamLessonPackView`, `AiEditingWorkspace`, `PricingBillingModal`, profile and billing/history views.
- `src/context/` — auth, language and theme state.
- `src/db/` — Drizzle schema, connection, user/payment, project and editing-history database functions/config.
- `src/middleware/auth.ts` — API authentication and subscription guards.
- `src/services/` — Gemini editing and document text extraction.
- `src/utils/audioHelper.ts` — browser audio buffer analysis and SRT/VTT/lesson-pack formatting.
- `src/utils/sampleData.ts` — demonstration users, projects and transactions.
- `firebase-applet-config.json` — Firebase web-app configuration (public identifiers; its API key is not repeated here).
- `vite.config.ts`, `tsconfig.json`, `package.json`, `bun.lock` — frontend/tooling configuration and locked dependencies.
- `public/assets/aistudio/Editflow_Product_and_Engineering_Blueprint_e30e3b09.md` — large product/engineering blueprint; aspirational claims in this file need comparison with actual code.

## Confirmed user-facing capabilities

- Google sign-in, Firebase email/password sign-up/sign-in, password-reset email, and Firebase verification email calls are wired in the client. Legacy routes create a separate demo login flow.
- Project listing, create/update/delete API calls are present and database methods scope projects by requesting user.
- AI text edit supports prompt modes including proofread, flow, tone/style variants, summary, expansion, paraphrase, bullets conversion, filler-word cleanup, custom instruction, strength, and language. Editing history and AI usage APIs are present.
- Document text extraction (TXT/MD/CSV, DOCX, PDF) and text export routes are present.
- Browser audio analysis includes waveform/sample analysis and silence detection; subtitle editing and SRT/WebVTT generation/export utilities are present.
- Exam-pack UI and a Gemini generation endpoint are present, but project creation seeds sample/fallback content. Generation is gated by a paid-subscription middleware, while an absent Gemini key returns the existing pack.

## Critical limitations / known risks

1. **Critical — payment bypasses:** `server.ts` eSewa/Khalti verification handlers return `verified: true` on fallback; no authoritative gateway verification is visible. MBL UTR validation is not a bank API lookup, and `verifyBankSettlementAndIssueOtp` returns the OTP in the API response. `src/db/users.ts` contains demo universal OTP acceptance and calls an unimported `neq` helper in payment/OTP lookups; verification paths are broken as written. Do not use these flows for real money or enable paid entitlements until reviewed and fixed with approval.
2. **Critical — demo authentication:** `/api/auth/login` and `/api/auth/signup` accept email-only/no-password legacy flows and issue `shikshya-token-*`; `requireAuth` explicitly trusts this token prefix. Login fallback from Firebase failure in `AuthContext` can use this. Treat as a release blocker if publicly reachable.
3. **High — predictable download signing secret:** `server.ts` has a hardcoded HMAC fallback when `HMAC_SECRET` is absent. Signed link endpoint returns token and signature to caller, and download uses project lookup without an independent user auth check (authorization relies on link secrecy/signature). Production must have a strong secret and appropriate ownership/authorization design.
4. **High — media behavior differs from marketing:** `UploadModal` continues with a public sample video if no file is selected or upload fails; `/api/projects` builds fixed keep ranges and sample subtitles/lesson-pack; browser audio settings update metadata but no actual media transcoding pipeline is shown. No transcription service/model was found in the inspected repository.
5. **High — local file storage and validation:** uploaded media is on local filesystem; repository evidence does not establish persistent/shared storage on Cloud Run. Multer extension is retained and the endpoint checks broad MIME prefixes after disk write; robust content validation, ownership lifecycle, cleanup, retention and durable storage are not verified.
6. **Medium — frontend token storage:** Firebase ID tokens and user data are kept in `localStorage`; token refresh is only on Firebase auth-state change, so stale cached token handling needs review.
7. **Medium — unsafe export HTML:** `/api/ai/export` interpolates user-controlled title and content directly into generated HTML without escaping.
8. **Medium — unreliable AI charging/fallback semantics:** `/api/ai/edit` records usage before Gemini execution, so failed model requests may consume quota. Exam-pack Gemini errors are caught and returned as success with fallback content, which hides failure from users.
9. **Medium — potentially unsafe sample/marketing claims:** Landing copy asserts bank settlement verification, private bucket storage, short-lived HMAC protection, and detailed processing outcomes not demonstrated by the implementation. Sample data contains seeded identities/content and sample external media; distinguish sample/demo material from real customer evidence.

## Development and deployment

Repository scripts: `bun run dev` (`tsx server.ts`), `bun run build` (`vite build`), `bun run preview` (`vite preview`), `bun run start` (`tsx server.ts`), `bun run lint` (`tsc --noEmit`). Lockfile is `bun.lock`. `.env.example` names `GEMINI_API_KEY` and `APP_URL`; it does not document all runtime/database/Firebase Admin requirements. Server binds `0.0.0.0` on `PORT` or 3000. In production it serves `dist` and starts seeding PostgreSQL demo users/projects. No Dockerfile, Cloud Build config, deployment workflow, migration directory, or README was found in the recursive repository tree. The user-provided URL identifies an AI Studio app; Cloud Run domain and deployment state are not verifiable from source.

## Data and operational constraints

- PostgreSQL schema has profiles, subscriptions, payments, OTPs, projects, editing history, and AI usage tables. There are no Firestore/Supabase integrations in the inspected source.
- User records key off Firebase UID; project/history/payment operations generally use that authenticated ID. No SQL RLS policy, database grants, or production backup/restore procedure is present in repository files.
- No confirmed audio transcription history/table or user deletion/export workflow beyond project/edit-history deletes was found.
- Do not change live Firebase, SQL schema/records, payment integration, domain, secrets or hosting without explicit approval. Do not treat seeded data or simulated UI as proof of production behavior.

## Outstanding work

See `TASKS.md`. First priority is disabling demo auth/payment success paths before real public use, then checking deployment persistence/secrets/database protections and designing genuine media processing/transcription requirements. This audit did not fix application code.