# Backend Audit — Existing SkillPaper API

> Scope: current Express backend (`backend/src/`), **not** the planned upload/LLM feature.
> Audited: 2026-08-14
> Do not re-scan the whole repo unless this file is outdated. Fix by ID.

This document is the source of truth for skill `fix-backend-audit`. Resume import (`UploadedResume`) must not copy these patterns.

---

## 1. Summary

The builder API (`/api/resumes`, `/api/auth`, `/api/templates`) works for a single-user demo but is not safe for multi-user production.

| Severity | Count | Highest-impact |
|---|---|---|
| Critical | 3 | IDOR on get/download; unauthenticated PDF cleanup |
| High | 4 | Default JWT secret; weak share tokens; no rate limits; ephemeral PDFs |
| Medium | 4 | Incomplete update Joi schema; invalid ObjectId → 500; no automated tests; any user can create templates |
| Low | 2 | `(req as any).user`; register has no Joi / password policy |

**Fix order (must-fix first):** SEC-02 → SEC-03 → SEC-04 → SEC-06 → SEC-05 → BUG-02 / BUG-01 → SEC-07 → BUG-05. Then SEC-01 tests.

---

## 2. Finding index

| ID | Sev | Area | File(s) | Issue |
|---|---|---|---|---|
| **SEC-02** | Critical | IDOR | `controllers/resume.controller.ts` `getResume` | Auth required, **no ownership check**. Any logged-in user who knows a resume `_id` gets full `data` + populated user. |
| **SEC-03** | Critical | IDOR | `downloadResume` | Same: any authenticated user can download another user’s PDF. |
| **SEC-04** | Critical | Authz | `routes/resume.routes.ts` `POST /cleanup` | **No `authMiddleware`**. Anyone can delete PDFs under `os.tmpdir()/resume-maker`. |
| **SEC-05** | High | Crypto | `shareResume` | Share token is `Math.random().toString(36).substr(2, 15)` — predictable, short. Use `crypto.randomBytes`. |
| **SEC-06** | High | Auth | `utils/generateToken.ts`, `middlewares/authMiddleware.ts` | `JWT_SECRET \|\| 'replace_this_in_prod'`. App boots and signs tokens with a public default. |
| **SEC-07** | High | Abuse | `server.ts`, auth + PDF routes | No `express-rate-limit` (or equivalent) on register/login or PDF generate/preview. |
| **SEC-08** | Medium | Authz | `template.controller.ts` `createTemplate` | Route is authenticated but **not admin-only**. Any user can insert templates (including HTML). |
| **SEC-09** | Medium | Auth | `auth.controller.ts` `register` | No Joi schema, no min password length / complexity. |
| **BUG-01** | Medium | Validation | `validation/resume.validation.ts` | Duplicate keys on the same Joi object silently overwrite (last wins). Keep a **single** top-level `location`; nested `location` only inside experience/education items. |
| **BUG-02** | Medium | Validation | `updateResumeSchema` | Far smaller than `createResumeSchema`. Joi strips unknown keys by default, so PUT can drop `skills`, `projects`, `languages`, `references`, `additionalSections`, `achievements`. |
| **BUG-03** | Medium | Errors | `getResume`, `getTemplate`, etc. | Invalid Mongo `ObjectId` → Mongoose `CastError` → **500**. Should be **400**. |
| **BUG-04** | Low | Types | resume + auth controllers | Uses `(req as any).user` despite `types/express.d.ts` defining `req.user`. |
| **BUG-05** | High | Storage | `pdf.service.ts` | PDFs written to `os.tmpdir()/resume-maker`. Container restart or `cleanupOldPdfs` (24h) makes `download` 404. Need regenerate-on-miss or persistent storage. |
| **SEC-01** | Medium | Tests | `backend/package.json` | No Jest/Supertest. Scripts are manual PDF helpers, not API tests. |

---

## 3. Detailed findings

### SEC-02 — `GET /api/resumes/:id` missing ownership

**Current:** `authMiddleware` then `Resume.findById(id)` and return.

**Required:** After load, compare `resume.user` to `req.user._id`. If mismatch → **403** `{ message: 'Access denied' }` (same shape as `updateResume`). Do not leak existence vs forbidden if you prefer **404** for both missing and other-user — pick one and test it. Match existing mutate routes: **403**.

**Also:** Invalid `id` → 400 (see BUG-03).

Regenerate / preview / update / delete already check ownership. Do not “fix” those by removing checks.

---

### SEC-03 — `GET /api/resumes/:id/download` missing ownership

Same as SEC-02. Load resume, require owner, then `res.download`.

Do not trust `resume.pdfUrl` as an arbitrary filesystem path (path traversal if the field were ever writable). Resolve under the PDF output directory or regenerate.

---

### SEC-04 — `POST /api/resumes/cleanup` unauthenticated

**Current** (`resume.routes.ts`):

```ts
router.post('/cleanup', cleanupOldPdfsEndpoint);
```

**Required:** `authMiddleware` at minimum. Prefer admin-only or remove the HTTP route and run cleanup from a cron/job. Until admin roles exist: require auth **and** a dedicated `CLEANUP_TOKEN` header matching env, or restrict to `NODE_ENV === 'development'`.

Unauthenticated cleanup can delete every generated PDF on the host.

---

### SEC-05 — Share tokens

**Current:** `Math.random().toString(36).substr(2, 15)`.

**Required:**

```ts
import crypto from 'crypto';
const shareToken = crypto.randomBytes(32).toString('hex');
```

Keep `shareToken` unique sparse index on `Resume`. Public GET still unauthenticated; entropy is the control.

---

### SEC-06 — JWT secret fallback

**Current:** both `generateToken.ts` and `authMiddleware.ts`:

```ts
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_in_prod';
```

**Required:** On startup (`server.ts` before `listen`), if `!process.env.JWT_SECRET` or value is `replace_this_in_prod` / empty / too short (< 32 chars), **throw and exit**. Read secret once from env; do not duplicate fallbacks.

Document `JWT_SECRET` in `backend/.env.example` without a real production value.

---

### SEC-07 — Rate limits

Add `express-rate-limit` (or equivalent) in `server.ts` or dedicated middleware:

| Target | Suggested |
|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | Strict (e.g. 10 / 15 min / IP) |
| `POST /api/resumes`, `POST /api/resumes/:id/regenerate`, `GET /api/resumes/:id/preview` | Tighter (PDF/Puppeteer is expensive) |
| Global API | Loose ceiling |

Trust `X-Forwarded-For` only behind a known proxy (`app.set('trust proxy', 1)` when applicable).

---

### SEC-08 — Template create is not admin-only

`POST /api/templates` uses `authMiddleware` only. Template `html` is rendered with Handlebars + Puppeteer (XSS / HTML injection into PDF pipeline).

**Required (when fixing):** restrict to an admin flag on `User`, or disable create in production and seed templates via `seedDatabase.ts` only. Do not leave “any logged-in user may POST HTML templates.”

---

### SEC-09 — Register validation

`register` only checks presence of name/email/password. Add Joi (min password length, email format) via `validate()` like other routes.

---

### BUG-01 — Duplicate Joi keys (`location`)

In a JS object, a second `location:` at the **same** level overwrites the first. Nested `experience[].location` / `education[].location` are fine.

**Required:** One top-level `location` on personal data. No duplicate keys in `createResumeSchema` / `updateResumeSchema`.

---

### BUG-02 — `updateResumeSchema` incomplete

`createResumeSchema.data` includes skills, projects, languages, references, additionalSections, achievements, etc.

`updateResumeSchema.data` omits those. Default Joi strip means a valid full form PUT can persist a **partial** `data` object and wipe sections.

**Required:** Share one `resumeDataSchema` (create: required core fields; update: `.fork()` / all optional) so field lists cannot drift.

---

### BUG-03 — Invalid ObjectId → 500

`Resume.findById('not-an-id')` throws `CastError`. Controllers catch and return 500.

**Required:** `mongoose.Types.ObjectId.isValid(id)` (and 24-hex check) → 400, or a Mongoose error middleware mapping `CastError` → 400.

---

### BUG-04 — Untyped `req.user`

Use `req.user` from `express.d.ts` / `RequestWithUser`. Not a security bug; stop copying `(req as any).user` into new upload controllers.

---

### BUG-05 — Missing tmp PDFs

`generatePdfFromTemplate` writes `os.tmpdir()/resume-maker/resume-<ts>-<rand>.pdf` and stores that path in `Resume.pdfUrl`.

Failures:

- Process/container restart clears tmp
- `cleanupOldPdfs` deletes files older than 24h
- Download/public download then 404 even though the Mongo document exists

**Required (pick one, implement fully):**

1. **Regenerate on miss:** if file missing and caller is owner (or valid share token), regenerate from template + `data`, update `pdfUrl`, then stream; or
2. **Persistent storage:** store PDF bytes/object key in MinIO (same port as resume import later) and never depend on tmp.

Do not only “increase cleanup age.”

---

## 4. What is already OK (do not regress)

- `updateResume`, `deleteResume`, `regenerateResumePdf`, `previewResumePdf`, `shareResume`, `unshareResume` check `resume.user` vs `req.user._id`.
- `GET /api/resumes/user` filters by `user._id`.
- Passwords hashed with bcrypt; JWT in `Authorization: Bearer`.
- `GET /api/templates` public list is acceptable for a catalog.
- CORS locked to `FRONTEND_URL`; JSON body limit 10mb; a few security headers (not a substitute for Helmet, optional later).

---

## 5. Patterns **not** to copy into resume import

| Existing | Import feature must |
|---|---|
| Get-by-id without owner check | Every `uploaded-resumes/:id*` handler: owner or 403 |
| Cleanup without auth | No unauthenticated admin routes |
| `Math.random` tokens | `crypto.randomBytes` / UUID for object keys |
| Default JWT secret | Fail fast (SEC-06) before new routes |
| PDF path in tmp | MinIO via `IStorageService` |
| `(req as any).user` | Typed `req.user` |

Ownership helper (reuse for builder + import):

```ts
function assertResumeOwner(resume: { user: unknown }, userId: string): void {
  if (String(resume.user) !== String(userId)) {
    const err = new Error('Access denied');
    (err as any).status = 403;
    throw err;
  }
}
```

---

## 6. Suggested code touch list (audit fixes only)

| ID | Touch |
|---|---|
| SEC-02, SEC-03, BUG-03 | `resume.controller.ts` `getResume`, `downloadResume` |
| SEC-04 | `resume.routes.ts` + `cleanupOldPdfsEndpoint` |
| SEC-05 | `shareResume` in `resume.controller.ts` |
| SEC-06 | `server.ts`, `generateToken.ts`, `authMiddleware.ts`, `.env.example` |
| SEC-07 | new middleware + mount on auth + PDF routes |
| BUG-01, BUG-02 | `resume.validation.ts` (shared data schema) |
| BUG-05 | `downloadResume` / `downloadPublicResume` + `pdf.service.ts` |
| SEC-01 | Jest + Supertest (section 9) |
| SEC-08, SEC-09 | Optional in the same PR if time; not in the “SEC-02…SEC-06 only” slice |

---

## 7. Out of scope for this audit

- Implementing `UploadedResume`, Gemini, MinIO, ClamAV (see `implementation-plan.md`)
- Template visual redesign
- Frontend XSS (separate from backend IDOR)
- Full OWASP pass / dependency CVE dump

---

## 8. Residual risk after must-fix slice

After SEC-02–06 only: IDOR and default JWT and cleanup and share entropy are addressed. Still open until later slices: rate limits (SEC-07), tmp PDFs (BUG-05), tests (SEC-01), template admin (SEC-08), register Joi (SEC-09).

---

## 9. Tests (SEC-01)

Add Jest + Supertest. Suggested: `backend/src/__tests__/*.test.ts`.

`package.json`: `"test": "jest --runInBand"` (or project equivalent). Use mongodb-memory-server or a test DB; never the dev volume.

**First tests:**

| Case | Expect |
|---|---|
| `POST /api/auth/register` valid | 201, `token`, user without `password` |
| `POST /api/auth/login` wrong password | 401 |
| `GET /api/resumes/:id` as other user | **403** (SEC-02) |
| `GET /api/resumes/:id/download` as other user | **403** (SEC-03) |
| `GET /api/resumes/not-an-objectid` | **400** (BUG-03) |
| `GET /api/resumes/public/:token` after expiry | **410** |
| `POST /api/resumes/cleanup` without auth | **401** (SEC-04) |
| Share token entropy | not equal to `Math.random` pattern; unique |

Mock Puppeteer in unit tests; do not require Chrome for ownership tests.

---

## 10. Chat slices (quota)

1. SEC-02, SEC-03, SEC-04, SEC-05, SEC-06 only  
2. Jest + section 9 tests  
3. SEC-07 + BUG-05  
4. BUG-01/BUG-02, then SEC-08/SEC-09 if needed  

Do not mix these with Gemini/MinIO work.
