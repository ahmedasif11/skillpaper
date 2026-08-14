# Requirements

> Feature: Resume Upload & LLM Auto-fill
> Last updated: 2026-08-14

---

## 1. Functional Requirements

### 1.1 Resume Library (User's Uploaded Resumes)

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | An authenticated user must be able to upload one or more resume files | P0 |
| FR-1.2 | Supported upload formats: PDF (.pdf) and Word Document (.docx) | P0 |
| FR-1.3 | A user can upload a maximum of **10 resumes** at a time in their library | P1 |
| FR-1.4 | Each uploaded resume must have a user-defined label/name (e.g., "Software Engineer Resume 2025") | P1 |
| FR-1.5 | A user can **delete** any uploaded resume from their library | P0 |
| FR-1.6 | A user can **view** the list of their uploaded resumes (name, upload date, file size, last used) | P0 |
| FR-1.7 | A user can **replace/update** an existing resume slot by re-uploading a new file | P1 |
| FR-1.8 | Resume library must be accessible from the dashboard and from the form page | P0 |

### 1.2 File Upload & Storage

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | Files must be uploaded via a multipart/form-data POST request | P0 |
| FR-2.2 | Maximum file size per upload: **10 MB** | P0 |
| FR-2.3 | Files must be stored in **MinIO** (S3-compatible object storage) | P0 |
| FR-2.4 | Each file must be stored under a user-scoped path: `resumes/{userId}/{resumeId}/{filename}` | P0 |
| FR-2.5 | The original file must be preserved in storage even after parsing | P1 |
| FR-2.6 | Pre-signed download URLs must be generated for users to re-download their original files | P2 |
| FR-2.7 | Files must be deleted from MinIO when a user deletes the resume from their library | P0 |

### 1.3 Security Scanning

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | Every uploaded file must be scanned for malware before any processing occurs | P0 |
| FR-3.2 | Files must be quarantined (not processed, not stored permanently) if malware is detected | P0 |
| FR-3.3 | The user must be notified immediately if their upload is rejected due to malware | P0 |
| FR-3.4 | Image layers within PDF files must be analyzed for embedded malicious content using OpenCV | P1 |
| FR-3.5 | File MIME type must be validated server-side (not just relying on extension) | P0 |
| FR-3.6 | File content must be verified to match its declared type (magic bytes check) | P0 |
| FR-3.7 | Scanning must complete before any LLM parsing begins | P0 |

### 1.4 Resume Parsing (LLM + Pre-processors)

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | Raw text must be extracted from the file before being sent to the LLM (pdf-parse for PDF, mammoth for DOCX) | P0 |
| FR-4.2 | Extracted text must be sent to **Google Gemini API** for structured data extraction | P0 |
| FR-4.3 | Gemini must return data conforming to SkillPaper's `ResumeFormData` schema (see data-models.md) | P0 |
| FR-4.4 | If Gemini extraction fails or returns incomplete data, the system must fall back gracefully with partial data and a user warning | P1 |
| FR-4.5 | Parsing must run as a **background job** (BullMQ queue) so the user is not blocked | P0 |
| FR-4.6 | The user must see a real-time status indicator: Uploading → Scanning → Parsing → Ready | P0 |
| FR-4.7 | Parsed data must be stored in MongoDB associated with the uploaded resume record | P0 |
| FR-4.8 | A SHA-256 hash of the file content must be stored to enable change detection | P0 |

### 1.5 Change Detection & Caching

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | When a user selects a previously uploaded resume, the system must check if parsed data already exists | P0 |
| FR-5.2 | If parsed data exists and the file has not changed (hash match), the cached data must be used directly — no re-parse | P0 |
| FR-5.3 | If a user re-uploads a resume file and the SHA-256 hash differs from the stored hash, a re-parse must be triggered automatically | P0 |
| FR-5.4 | If a user re-uploads the same file (identical hash), the system must notify the user that it is unchanged and skip re-processing | P1 |
| FR-5.5 | Cached parsed data must be invalidated and re-fetched if the user explicitly requests a re-parse | P2 |

### 1.6 Form Auto-fill

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | On the form page (`/resume/form`), there must be a visible "Import from Resume" button | P0 |
| FR-6.2 | Clicking "Import from Resume" must open a modal/panel showing the user's resume library | P0 |
| FR-6.3 | The user must be able to select any resume from the library to auto-fill the form | P0 |
| FR-6.4 | Auto-fill must populate **all applicable form fields** across all 6 steps | P0 |
| FR-6.5 | Auto-fill must **not overwrite** fields the user has already manually edited, unless explicitly confirmed | P1 |
| FR-6.6 | A preview of what data will be filled must be shown before the user confirms the import | P2 |
| FR-6.7 | After auto-fill, the user must be able to edit any field normally | P0 |
| FR-6.8 | A "Clear imported data" action must reset the form to blank (or original state) | P2 |
| FR-6.9 | If the resume is still being parsed (job pending), the user must be shown a waiting indicator and notified when ready | P1 |

### 1.7 Resume Data Persistence & Linking

| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | When a user saves a SkillPaper resume (the builder output), the ID of the uploaded source resume used for auto-fill must be stored as a reference | P1 |
| FR-7.2 | If the user later updates their uploaded resume file, they must be offered the option to re-apply new parsed data to linked SkillPaper resumes | P2 |
| FR-7.3 | The user must be able to detach the link between a SkillPaper resume and its source uploaded resume | P2 |

---

## 2. Non-Functional Requirements

### 2.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-1.1 | File upload response (acknowledgment) | < 2 seconds |
| NFR-1.2 | Security scan completion | < 10 seconds per file |
| NFR-1.3 | LLM parsing completion (background) | < 30 seconds (typical) |
| NFR-1.4 | Form auto-fill (applying cached data to form) | < 500ms |
| NFR-1.5 | Resume library listing API | < 1 second |

### 2.2 Scalability

| ID | Requirement |
|---|---|
| NFR-2.1 | Parsing jobs must be handled by a distributed queue (BullMQ + Redis) to support concurrent users |
| NFR-2.2 | MinIO must be configured with sufficient storage quotas per user to prevent abuse |
| NFR-2.3 | The parsing microservice (Python/Node) must be independently scalable |

### 2.3 Security

| ID | Requirement |
|---|---|
| NFR-3.1 | All uploaded files must be treated as untrusted input |
| NFR-3.2 | Files must never be executed or served with executable MIME types |
| NFR-3.3 | MinIO bucket must not be publicly accessible; all access via pre-signed URLs with TTL |
| NFR-3.4 | Gemini API key must be stored server-side only, never exposed to the client |
| NFR-3.5 | User X must not be able to access, read, or trigger parsing of User Y's files |
| NFR-3.6 | All file metadata and parsed data endpoints must require JWT authentication |

### 2.4 Reliability

| ID | Requirement |
|---|---|
| NFR-4.1 | If a parsing job fails, it must be retried up to 3 times before marking as failed |
| NFR-4.2 | A failed parse must not prevent the user from using the file via manual entry |
| NFR-4.3 | Storage (MinIO) and parsing failures must be logged with enough detail for debugging |

### 2.5 Usability

| ID | Requirement |
|---|---|
| NFR-5.1 | Upload, scan, and parse status must be communicated in real-time via polling or WebSocket |
| NFR-5.2 | All error states (malware, bad format, parse failure) must show user-friendly messages |
| NFR-5.3 | The feature must be fully usable on mobile viewports |
| NFR-5.4 | The import flow must not require more than 3 user interactions from start to auto-filled form |

### 2.6 Compatibility

| ID | Requirement |
|---|---|
| NFR-6.1 | Must support PDF versions 1.4 through 2.0 |
| NFR-6.2 | Must support DOCX (Office Open XML) format |
| NFR-6.3 | Must handle multi-page PDFs |
| NFR-6.4 | Must handle PDFs with embedded images (scanned resume fallback: OCR via Tesseract) |

---

## 3. Constraints

- The app is currently a monorepo with Express backend + Next.js frontend. New services (MinIO, Redis, scanning microservice) will be added to the Docker Compose setup.
- The existing `Resume` MongoDB model represents the **builder output** (template + filled data). The new `UploadedResume` model represents the **source file**. These are two separate concepts.
- Gemini API has rate limits (see [Gemini API pricing](https://ai.google.dev/pricing)). Caching parsed data is essential to stay within quota.
- OpenCV is a Python library. It will be encapsulated in a lightweight Python FastAPI microservice to avoid adding Python to the Node.js backend.

---

## 4. Assumptions

- Users are authenticated before they can upload resumes (no anonymous uploads).
- Gemini API access (API key) will be provisioned by the development team.
- MinIO will be self-hosted via Docker Compose for development; in production, can be replaced by AWS S3 or any S3-compatible provider.
- ClamAV will be self-hosted via Docker Compose (using the `clamav/clamav` image).
- The existing multi-step form schema (`ResumeFormData`) will not change as part of this feature — the LLM must map to it.

---

## 5. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| Q1 | Should scanned/parsed data be deleted after N days of inactivity to save storage? | Product | Open |
| Q2 | Should we support image-only (scanned) PDFs via OCR (Tesseract)? | Engineering | Open |
| Q3 | What is the maximum number of uploaded resumes per user (quota)? | Product | Tentative: 10 |
| Q4 | Should users be able to share their resume library across devices/sessions? (It's cloud-based by default) | Product | Open |
| Q5 | Should parsing errors auto-notify the user via email? | Product | Open |
| Q6 | Do we want AI to suggest improvements to parsed data, or only extract what's there? | Product | Open |
