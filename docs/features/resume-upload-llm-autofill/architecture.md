# System Architecture

> Feature: Resume Upload & LLM Auto-fill
> Last updated: 2026-08-14

---

## 1. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js)                            │
│                                                                     │
│  ┌───────────────┐  ┌─────────────────┐  ┌──────────────────────┐  │
│  │  Resume Form  │  │ Resume Library  │  │  Upload Modal/Panel  │  │
│  │  /resume/form │  │  /dashboard     │  │  (new component)     │  │
│  └───────┬───────┘  └────────┬────────┘  └──────────┬───────────┘  │
│          └──────────────────────────────────────────┘              │
│                              │  HTTP / REST                         │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                    BACKEND (Express / Node.js)                      │
│                                                                     │
│  ┌────────────────────┐  ┌────────────────────────────────────────┐ │
│  │  Existing APIs     │  │         New APIs                       │ │
│  │  /api/auth         │  │  POST /api/uploaded-resumes (upload)   │ │
│  │  /api/resumes      │  │  GET  /api/uploaded-resumes            │ │
│  │  /api/templates    │  │  DELETE /api/uploaded-resumes/:id      │ │
│  └────────────────────┘  │  GET  /api/uploaded-resumes/:id/status │ │
│                           │  GET  /api/uploaded-resumes/:id/data  │ │
│                           │  POST /api/uploaded-resumes/:id/reparse│ │
│                           └────────────────┬───────────────────────┘ │
│                                            │                        │
│  ┌─────────────────────────────────────────▼──────────────────────┐ │
│  │                     Upload Pipeline                            │ │
│  │                                                                │ │
│  │  multer (memory) → MIME validate → magic bytes check          │ │
│  │       → MinIO upload → ClamAV scan → enqueue parse job        │ │
│  └──────────────────────────┬─────────────────────────────────────┘ │
│                             │  BullMQ job                           │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────┐
│                    BACKGROUND WORKERS                               │
│                                                                     │
│  ┌──────────────────────────▼─────────────────────────────────────┐ │
│  │                    Parse Worker (Node.js)                      │ │
│  │                                                                │ │
│  │  1. Fetch file from MinIO                                      │ │
│  │  2. Extract text (pdf-parse / mammoth)                         │ │
│  │  3. Call OpenCV microservice for image scan                    │ │
│  │  4. Call Gemini API with structured prompt                     │ │
│  │  5. Validate + normalise Gemini response                       │ │
│  │  6. Store parsed data in MongoDB                               │ │
│  │  7. Update job status to "ready"                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────┐
│                    INFRASTRUCTURE SERVICES                          │
│                                                                     │
│  ┌────────────────┐  ┌─────────────┐  ┌────────────────────────┐   │
│  │  MongoDB       │  │  Redis      │  │  MinIO (S3)            │   │
│  │  (existing +   │  │  BullMQ     │  │  file storage          │   │
│  │  new models)   │  │  queue +    │  │  resumes/{uid}/{id}/   │   │
│  │                │  │  cache      │  │  file.pdf              │   │
│  └────────────────┘  └─────────────┘  └────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────┐  ┌────────────────────────────┐  │
│  │  ClamAV (antivirus daemon)   │  │  OpenCV Microservice       │  │
│  │  clamav/clamav Docker image  │  │  Python + FastAPI          │  │
│  │  TCP socket scan             │  │  POST /scan-images         │  │
│  └──────────────────────────────┘  └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │   Gemini API        │
                   │   (Google AI)       │
                   │   gemini-3.5-flash  │
                   └─────────────────────┘
```

---

## 2. Service Breakdown

### 2.1 Frontend (Next.js 15)

**Changes/Additions:**

| Component/File | Change | Description |
|---|---|---|
| `src/app/resume/form/page.tsx` | Modified | Add "Import from Resume" button + handler |
| `src/components/resume-import/ImportModal.tsx` | New | Modal to browse/select uploaded resumes |
| `src/components/resume-import/UploadResumePanel.tsx` | New | Drag-and-drop upload UI |
| `src/components/resume-import/ParseStatusBadge.tsx` | New | Shows parsing status (pending/scanning/ready/failed) |
| `src/app/dashboard/page.tsx` | Modified | Add "My Uploaded Resumes" section |
| `src/app/resume-library/page.tsx` | New (optional) | Dedicated resume library management page |
| `src/lib/api.ts` | Modified | Add `uploadedResumesAPI` methods |
| `src/hooks/useUploadedResumes.ts` | New | React hook for uploaded resume state |
| `src/hooks/useParseStatus.ts` | New | Polling hook for parse job status |

### 2.2 Backend (Express + Node.js)

**New modules:**

| Module | Path | Description |
|---|---|---|
| Route | `src/routes/uploadedResume.routes.ts` | All uploaded-resume endpoints |
| Controller | `src/controllers/uploadedResume.controller.ts` | Request handlers |
| Service: Storage | `src/services/storage.service.ts` | MinIO integration (upload, delete, presign) |
| Service: Scanner | `src/services/scanner.service.ts` | ClamAV + OpenCV scan orchestration |
| Service: Parser | `src/services/resumeParser.service.ts` | Text extraction + Gemini call |
| Service: Queue | `src/services/queue.service.ts` | BullMQ producer |
| Worker | `src/workers/parseResume.worker.ts` | BullMQ consumer — runs the full parse pipeline |
| Model | `src/models/UploadedResume.ts` | New MongoDB model |
| Validation | `src/validation/uploadedResume.validation.ts` | Joi schema |

### 2.3 OpenCV Microservice (Python / FastAPI)

A lightweight, standalone Python service responsible for:
- Rendering PDF pages to images (using `pdf2image` or `pypdfium2`)
- Analyzing images with OpenCV for suspicious patterns
- Detecting steganographic content
- Returning a risk score and flagged issues

**Endpoint:** `POST /scan-images`  
**Input:** base64-encoded PDF pages  
**Output:** `{ safe: boolean, score: number, findings: string[] }`

**Technology stack:**
- Python 3.11
- FastAPI
- OpenCV (`opencv-python-headless`)
- pdf2image
- Pillow

### 2.4 MinIO (Object Storage)

- S3-compatible, self-hosted
- Used for persistent storage of raw uploaded resume files
- Bucket: `skillpaper-resumes`
- Object path structure: `{userId}/{uploadedResumeId}/{originalFilename}`
- Access policy: private (all access via signed URLs)
- Retention: files retained as long as the `UploadedResume` record exists

### 2.5 ClamAV (Antivirus)

- Self-hosted via Docker (`clamav/clamav`)
- Integrated using `clamscan` CLI or `clamd` TCP socket
- Node.js library: `clamscan` npm package
- Virus definitions auto-updated on container start

### 2.6 BullMQ + Redis

- All parsing runs asynchronously in background jobs
- Job payload: `{ uploadedResumeId, userId, minioObjectKey }`
- Job states tracked in MongoDB (`UploadedResume.parseStatus`)
- Redis used as BullMQ backing store
- Retry strategy: 3 retries with exponential backoff

### 2.7 Google Gemini API

- Model: `gemini-3.5-flash` (Gemini 2.0 Flash and 1.5 Pro were shut down)
- Called from the Parse Worker (server-side only)
- API key stored in backend `.env` (`GEMINI_API_KEY`)
- Structured output mode (`response_mime_type: "application/json"`) used for schema compliance

---

## 3. Updated Docker Compose Services

```yaml
# docker-compose.yml additions

services:
  # --- Existing ---
  mongo:       # unchanged
  backend:     # gains env vars for Redis, MinIO, Gemini, ClamAV
  frontend:    # unchanged

  # --- New ---
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis-data:/data]

  minio:
    image: minio/minio:latest
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: skillpaper
      MINIO_ROOT_PASSWORD: skillpaper_secret
    command: server /data --console-address ":9001"
    volumes: [minio-data:/data]

  clamav:
    image: clamav/clamav:stable
    ports: ["3310:3310"]
    volumes: [clamav-db:/var/lib/clamav]

  opencv-service:
    build: ./services/opencv-service
    ports: ["8001:8001"]
    environment:
      - MAX_FILE_SIZE_MB=10
```

---

## 4. Data Flow: Upload → Auto-fill

```
Step 1: User selects a file on the frontend
         └─ Validation: extension, size < 10MB

Step 2: Frontend POSTs to POST /api/uploaded-resumes (multipart)
         └─ Backend: multer reads file into memory buffer

Step 3: Backend: MIME type + magic bytes validation
         └─ Reject non-PDF/DOCX with 422

Step 4: Backend: Upload raw file to MinIO
         └─ Key: {userId}/{newObjectId}/{filename}
         └─ Returns: MinIO object key

Step 5: Backend: Create UploadedResume document in MongoDB
         └─ Status: "uploaded", no parsed data yet
         └─ Returns: 201 with { id, status: "uploaded" }

Step 6: Backend: Enqueue BullMQ job { uploadedResumeId }

Step 7: Frontend: Polls GET /api/uploaded-resumes/:id/status every 3s
         └─ Shows: "Scanning..." → "Parsing..." → "Ready ✓"

Step 8: Parse Worker picks up job:
         └─ 8a. Fetch file buffer from MinIO
         └─ 8b. Text extraction (pdf-parse or mammoth)
         └─ 8c. POST to OpenCV service (image safety check)
              └─ If unsafe → mark as "failed:malware", notify user, DELETE from MinIO
         └─ 8d. Build Gemini prompt with extracted text
         └─ 8e. Call Gemini API → structured JSON response
         └─ 8f. Validate + normalise response → ResumeFormData shape
         └─ 8g. Compute SHA-256 of original file, store in DB
         └─ 8h. Save parsed data to UploadedResume.parsedData
         └─ 8i. Set status to "ready"

Step 9: Frontend: Status poll returns "ready"
         └─ User sees "Ready to import" button

Step 10: User clicks "Apply to Form"
          └─ Frontend GETs /api/uploaded-resumes/:id/data
          └─ Maps parsedData → form state (hydrateFormFromParsedResume())
          └─ All form fields auto-populated
          └─ User reviews and submits
```

---

## 5. Change Detection Flow

```
User re-uploads a file to an existing library slot:

  Frontend POSTs to PUT /api/uploaded-resumes/:id/file

  Backend:
    1. Compute SHA-256 of new file
    2. Compare with stored UploadedResume.fileHash
    3a. Same hash → respond: { changed: false } → no re-parse triggered
    3b. Different hash:
         → Upload new file to MinIO (replace)
         → Clear old parsedData
         → Set status to "pending"
         → Enqueue new parse job
         → Respond: { changed: true, status: "pending" }

User sees notification:
  Same file:  "This resume is unchanged. Using existing data."
  New file:   "New version detected! Re-parsing... (est. 20s)"
```

---

## 6. Ports & Adapters Design

All external service integrations (LLM, storage, scanner, queue, text extractor) are built behind **TypeScript interfaces** so they can be swapped without touching business logic. See **[`interfaces-and-adapters.md`](./interfaces-and-adapters.md)** for:

- Full interface definitions (`ILlmService`, `IStorageService`, `IScannerService`, `ITextExtractor`, `IQueueService`)
- All adapters for each interface (Gemini, OpenAI, MinIO, S3, ClamAV, VirusTotal, BullMQ, etc.)
- The central `container.ts` wiring file
- How to swap vendors with a single line of code
- Environment-based adapter selection

**The golden rule:** controllers, services, and workers import from `interfaces/` only — never from `adapters/` directly.

---

## 7. Technology Choices Rationale

| Technology | Why Chosen | Alternatives Considered |
|---|---|---|
| **Gemini 2.0 Flash** | Fast, cheap, supports structured JSON output, generous free tier | OpenAI GPT-4o, Claude 3.5, local Ollama |
| **MinIO** | S3-compatible, self-hosted, free, easy Docker deployment | AWS S3 (production upgrade path), Cloudflare R2 |
| **BullMQ** | Battle-tested Node.js job queue, Redis-backed, built-in retry | Bull (older), Agenda (MongoDB-backed), Bee-Queue |
| **ClamAV** | Open-source, actively maintained, self-hostable, broad malware DB | VirusTotal API (paid, rate-limited), YARA rules |
| **OpenCV (Python)** | Industry standard for image analysis; isolated in its own service | Sharp (JS), Jimp — but less powerful for threat detection |
| **pdf-parse** | Lightweight, zero native dependencies | pdfjs-dist (heavier), pdf2json |
| **mammoth** | Best-in-class DOCX → plain text conversion | docxtemplater, officegen |
| **FastAPI** | Fast Python web framework, automatic OpenAPI docs, async | Flask, Django — heavier for a microservice |

---

## 7. Environment Variables

### Backend `.env` additions

```env
# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=skillpaper
MINIO_SECRET_KEY=skillpaper_secret
MINIO_BUCKET_NAME=skillpaper-resumes
MINIO_USE_SSL=false

# Redis / BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379

# Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash

# ClamAV
CLAMAV_HOST=localhost
CLAMAV_PORT=3310

# OpenCV microservice
OPENCV_SERVICE_URL=http://localhost:8001

# Upload limits
MAX_UPLOAD_SIZE_MB=10
MAX_RESUMES_PER_USER=10
```

### OpenCV service `.env`

```env
MAX_FILE_SIZE_MB=10
LOG_LEVEL=info
```
