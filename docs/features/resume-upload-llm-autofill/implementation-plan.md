# Implementation Plan

> Feature: Resume Upload & LLM Auto-fill
> Last updated: 2026-08-14

---

## Overview

This feature is split into **4 phases**. Each phase delivers working, testable functionality. Phases can be worked on sequentially or with some parallelism between frontend and backend.

**Estimated total effort:** 6–8 weeks (1 developer, full-time)

---

## Phase 1 — Infrastructure & Foundation (Week 1–2)

**Goal:** Get all new services running in Docker Compose, core file upload pipeline working end-to-end, basic MongoDB model in place.

### Backend Tasks

| Task | File(s) | Est. |
|---|---|---|
| Create all interface files (`ILlmService`, `IStorageService`, `IScannerService`, `ITextExtractor`, `IQueueService`) | `src/interfaces/` | 2h |
| Create `src/container.ts` (adapter wiring) — stub with placeholders | `src/container.ts` | 1h |
| Add Redis + MinIO + ClamAV to `docker-compose.yml` | `docker-compose.yml` | 2h |
| Create `src/models/UploadedResume.ts` (MongoDB model) | new file | 2h |
| Create `src/services/storage.service.ts` (MinIO integration) | new file | 4h |
| Create `src/services/scanner.service.ts` (ClamAV basic scan) | new file | 3h |
| Create `src/services/queue.service.ts` (BullMQ setup) | new file | 3h |
| Create `POST /api/uploaded-resumes` endpoint (upload + queue job) | new files | 4h |
| Create `GET /api/uploaded-resumes` (list) | new file | 2h |
| Create `DELETE /api/uploaded-resumes/:id` (delete + MinIO cleanup) | new file | 2h |
| Add multer middleware for file uploads | `src/middlewares/upload.ts` | 1h |
| Write basic parse worker skeleton (no Gemini yet, just status transitions) | `src/workers/parseResume.worker.ts` | 3h |
| Add env variables + update `.env.example` | `.env.example` | 1h |

### Deliverable
- Can upload a file, it gets stored in MinIO, scanned by ClamAV, and status tracked in MongoDB.
- No LLM parsing yet.

---

## Phase 2 — LLM Parsing Pipeline (Week 3–4)

**Goal:** Full Gemini integration, text extraction, structured data output, status polling.

### Backend Tasks

| Task | File(s) | Est. |
|---|---|---|
| Install + configure `@google/generative-ai` | `package.json` | 0.5h |
| Create `src/services/gemini.service.ts` (Gemini structured output) | new file | 6h |
| Create `src/services/gemini.schema.ts` (JSON schema) | new file | 3h |
| Create `src/services/gemini.prompts.ts` (prompt builder) | new file | 2h |
| Create `src/services/resumeParser.normalise.ts` (Zod validation) | new file | 3h |
| Integrate `pdf-parse` for PDF text extraction in worker | worker | 2h |
| Integrate `mammoth` for DOCX text extraction in worker | worker | 2h |
| Complete parse worker: full pipeline (fetch → extract → scan → parse → store) | worker | 6h |
| Create `GET /api/uploaded-resumes/:id/status` (polling endpoint) | controller | 1h |
| Create `GET /api/uploaded-resumes/:id/data` (parsed data endpoint) | controller | 1h |
| Create `POST /api/uploaded-resumes/:id/reparse` (manual retry) | controller | 2h |
| Add confidence score computation | `resumeParser.normalise.ts` | 2h |
| Add file hash computation + storage | worker | 1h |
| Add change detection in `PUT /api/uploaded-resumes/:id/file` | controller | 3h |

### Python OpenCV Service Tasks

| Task | File(s) | Est. |
|---|---|---|
| Create Python FastAPI microservice skeleton | `services/opencv-service/` | 2h |
| Implement PDF→images rendering (`pdf2image`) | `main.py` | 2h |
| Implement OpenCV image analysis (LSB entropy, dark page check) | `main.py` | 4h |
| Add Dockerfile for opencv-service | `Dockerfile` | 1h |
| Add opencv-service to docker-compose.yml | `docker-compose.yml` | 0.5h |
| Integrate opencv service call in scanner.service.ts | `scanner.service.ts` | 2h |

### Deliverable
- Full pipeline works end-to-end: upload → scan → parse → status polling → structured data available.
- OpenCV microservice integrated for PDF image analysis.

---

## Phase 3 — Frontend Integration (Week 4–5)

**Goal:** UI components for upload, library management, status tracking, and form auto-fill.

### Frontend Tasks

| Task | File(s) | Est. |
|---|---|---|
| Add `uploadedResumesAPI` to `src/lib/api.ts` | `api.ts` | 2h |
| Create `useUploadedResumes` hook | `src/hooks/useUploadedResumes.ts` | 2h |
| Create `useParseStatus` polling hook | `src/hooks/useParseStatus.ts` | 2h |
| Add new TypeScript types to `src/types/index.ts` | `types/index.ts` | 1h |
| Create `ParseStatusBadge` component | `src/components/resume-import/ParseStatusBadge.tsx` | 2h |
| Create `UploadResumePanel` (drag-and-drop upload UI) | `src/components/resume-import/UploadResumePanel.tsx` | 5h |
| Create `ResumeLibraryCard` (individual card) | `src/components/resume-import/ResumeLibraryCard.tsx` | 3h |
| Create `ResumeLibraryList` (list of cards) | `src/components/resume-import/ResumeLibraryList.tsx` | 2h |
| Create `ImportPreview` (confirmation screen) | `src/components/resume-import/ImportPreview.tsx` | 3h |
| Create `InlineUploadProgress` (upload/parse progress) | `src/components/resume-import/InlineUploadProgress.tsx` | 3h |
| Create `ImportModal` (main container) | `src/components/resume-import/ImportModal.tsx` | 4h |
| Write `hydrateFormFromParsedResume` utility | `src/lib/hydrateFormFromParsedResume.ts` | 4h |
| Integrate "Import from Resume" button in form page | `src/app/resume/form/page.tsx` | 3h |
| Add imported data banner + clear import button to form | `src/app/resume/form/page.tsx` | 2h |
| Add "My Uploaded Resumes" section to dashboard | `src/app/dashboard/page.tsx` | 4h |
| Add inline upload progress to modal | `ImportModal.tsx` | 2h |

### Deliverable
- Complete UI flow: upload from dashboard → watch status → import on form page → auto-filled form.

---

## Phase 4 — Polish, Edge Cases & Testing (Week 6–8)

**Goal:** Handle all edge cases, error states, OCR fallback, quota enforcement, rename, and thorough testing.

### Edge Case Handling

| Task | Est. |
|---|---|
| Implement Tesseract OCR fallback for image-only PDFs | 4h |
| Handle encrypted PDF gracefully (friendly error) | 1h |
| Handle zip bomb DOCX detection | 2h |
| Quota enforcement (10 resumes max per user) with proper error | 1h |
| Rate limiting on upload + reparse endpoints | 2h |
| Cascade null on Resume.sourceUploadedResumeId when uploaded resume deleted | 1h |
| Long-text chunking for large resumes (> 12,000 chars) | 3h |
| Gemini fallback: Flash → Pro on low confidence | 2h |
| Parse job timeout + dead letter queue handling | 3h |
| MinIO connection retry on startup | 1h |
| ClamAV warmup: wait for virus DB to load before accepting uploads | 1h |

### Additional Features

| Task | Est. |
|---|---|
| `PUT /api/uploaded-resumes/:id` (rename label) | 1h |
| `GET /api/uploaded-resumes/:id/download` (pre-signed URL) | 1h |
| Rename uploaded resume from UI | 2h |
| Download original file from UI | 1h |
| Resume library management page (`/resume-library`) [optional] | 8h |

### Testing

| Task | Est. |
|---|---|
| Unit tests: magic bytes validator | 1h |
| Unit tests: Zod schema validation for Gemini output | 2h |
| Unit tests: `hydrateFormFromParsedResume` mapping function | 2h |
| Unit tests: confidence score computation | 1h |
| Unit tests: change detection (hash comparison) | 1h |
| Integration tests: full upload → parse pipeline (mock Gemini) | 4h |
| Integration tests: ClamAV scan (test with EICAR test file) | 2h |
| E2E test: upload → auto-fill → save resume | 3h |

---

## Dependencies Between Phases

```
Phase 1 (Infrastructure) ──► Phase 2 (LLM Pipeline) ──► Phase 3 (Frontend) ──► Phase 4 (Polish)
     ↑                              ↑
  Must complete                 Can start OpenCV
  before any                    service in parallel
  other work                    with Phase 2
```

Phase 3 (frontend) can begin in parallel with Phase 2 once the API contracts (`api-design.md`) are finalised, by using mock API responses.

---

## New npm Packages

### Backend

```bash
# Storage
npm install minio

# Queue
npm install bullmq
npm install ioredis

# File upload
npm install multer
npm install @types/multer

# PDF text extraction
npm install pdf-parse
npm install @types/pdf-parse

# DOCX text extraction
npm install mammoth

# Antivirus
npm install clamscan

# LLM
npm install @google/generative-ai

# Validation
npm install zod
```

### Python OpenCV Service

```txt
# services/opencv-service/requirements.txt
fastapi==0.115.0
uvicorn[standard]==0.30.6
opencv-python-headless==4.10.0.84
pdf2image==1.17.0
Pillow==10.4.0
numpy==2.1.0
python-multipart==0.0.9
pydantic==2.8.2
```

---

## Configuration Checklist

Before starting development, ensure the following are available:

- [ ] Gemini API key obtained from [Google AI Studio](https://aistudio.google.com)
- [ ] Docker Desktop / Docker Compose v2 installed
- [ ] MinIO running locally (`docker compose up minio`)
- [ ] Redis running locally (`docker compose up redis`)
- [ ] ClamAV container started and virus DB loaded (`docker compose up clamav`)
- [ ] Python 3.11+ installed for opencv-service development
- [ ] `GEMINI_API_KEY` added to `backend/.env`
- [ ] MinIO console accessible at `http://localhost:9001`
- [ ] Created `skillpaper-resumes` bucket in MinIO console

---

## Milestone Summary

| Milestone | Deliverable | Target |
|---|---|---|
| M1 — Infrastructure | File upload → MinIO → ClamAV → queued | End of Week 2 |
| M2 — Parsing Pipeline | Full LLM parse pipeline + status polling | End of Week 4 |
| M3 — Frontend | Full UI: upload + import modal + form auto-fill | End of Week 5 |
| M4 — Production-ready | Edge cases + OCR + tests + quota enforcement | End of Week 8 |

---

## Future Enhancements (Post-Launch)

These are out of scope for the initial release but should be planned for:

| Feature | Description | Priority |
|---|---|---|
| LinkedIn import | Parse user's LinkedIn profile via URL | Medium |
| GitHub import | Extract projects from GitHub profile | Low |
| AI suggestions | Gemini suggests improvements to parsed data | High |
| Version history | Track changes to parsed data over time | Medium |
| Local LLM option | Ollama-based parsing for privacy-conscious users | Low |
| Multi-language OCR | Tesseract with language packs for non-English resumes | Medium |
| Batch upload | Upload multiple resumes at once | Low |
| Resume diff viewer | Show what changed between resume versions | Medium |
| Auto-update linked resumes | When uploaded resume changes, prompt to update linked builder resumes | High |
