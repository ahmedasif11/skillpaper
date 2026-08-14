# Resume Handling

> Feature: Resume Upload & LLM Auto-fill
> Last updated: 2026-08-14

This document covers the complete lifecycle of an uploaded resume: from initial file selection by the user through scanning, parsing, storage, caching, reuse, and deletion.

---

## 1. The Resume Library Concept

A **Resume Library** is a per-user collection of uploaded resume files. It is entirely separate from the "SkillPaper Resumes" (builder outputs). Think of it as:

- **Uploaded Resume** = the source file the user brings in (PDF/DOCX they already have)
- **SkillPaper Resume** = the output the builder creates (template + form data → PDF)

```
User's Resume Library        SkillPaper Resumes (existing)
────────────────────         ──────────────────────────────
[my_cv_2025.pdf]     ──►     [Software Engineer @ Template A]
[old_resume.docx]    ──►     [Designer Portfolio @ Template B]
[linkedin_export.pdf]
```

One uploaded resume can feed auto-fill for **many** SkillPaper resumes.

---

## 2. Complete Resume Lifecycle

### 2.1 States

```
┌──────────────────────────────────────────────────────────────┐
│                     UploadedResume States                    │
│                                                              │
│  uploading → uploaded → scanning → parsing → ready          │
│                                  ↘             ↘            │
│                              failed:scan   failed:parse      │
│                                                              │
│  (Any state can transition to "deleted" by user action)      │
└──────────────────────────────────────────────────────────────┘
```

| State | Description |
|---|---|
| `uploading` | File is being received by the server (transient, not persisted) |
| `uploaded` | File stored in MinIO; awaiting scan + parse job to start |
| `scanning` | ClamAV + OpenCV scan in progress |
| `parsing` | LLM parsing job is running |
| `ready` | Parsed data available; file is safe and usable |
| `failed:scan` | Malware or suspicious content detected; file quarantined/deleted |
| `failed:parse` | LLM or text extraction failed; user can retry or use manual entry |

---

### 2.2 Phase 1: Client-Side Validation

Before the upload even reaches the server:

```
User selects file
    ├─ Check extension: must be .pdf or .docx
    ├─ Check size: must be < 10 MB
    ├─ If invalid → show error toast, stop
    └─ If valid → proceed with upload
```

**Frontend code location:** `src/components/resume-import/UploadResumePanel.tsx`

```ts
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): string | null {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) return 'Only PDF and DOCX files are supported.';
  if (file.size > MAX_SIZE_BYTES) return 'File must be smaller than 10 MB.';
  return null;
}
```

---

### 2.3 Phase 2: Server-Side Upload & Initial Validation

**Endpoint:** `POST /api/uploaded-resumes`

1. **multer** reads the multipart file into memory buffer (max 10MB)
2. **MIME type validation**: check `file.mimetype` against allowed list
   ```
   allowed: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
   ```
3. **Magic bytes validation**: inspect first bytes of buffer
   ```
   PDF:  %PDF  → 25 50 44 46
   DOCX: PK    → 50 4B 03 04  (ZIP-based format)
   ```
4. **User quota check**: count existing `UploadedResume` docs for this user. Reject with 429 if ≥ 10.
5. **Upload to MinIO**: stream buffer to `skillpaper-resumes/{userId}/{newObjectId}/{filename}`
6. **Create MongoDB document** with `status: "uploaded"`, `fileHash: null` (not yet computed), `parsedData: null`
7. **Enqueue BullMQ job**: `{ uploadedResumeId, userId, minioKey }`
8. **Return 201**: `{ id, status: "uploaded", label, createdAt }`

---

### 2.4 Phase 3: Security Scanning (Parse Worker — Scan Stage)

The BullMQ worker processes the job:

**Step 3a: Fetch file from MinIO**
```ts
const fileBuffer = await storageService.getObject(minioKey);
```

**Step 3b: ClamAV scan**
```ts
const scanResult = await scannerService.clamScan(fileBuffer);
// scanResult: { isInfected: boolean, viruses: string[] }
```
- If infected → set `status: "failed:scan"`, delete from MinIO, update DB, throw job error

**Step 3c: OpenCV image scan** (for PDFs only)
```ts
if (isPdf) {
  const imageCheckResult = await scannerService.openCvScan(fileBuffer);
  // imageCheckResult: { safe: boolean, score: number, findings: string[] }
  if (!imageCheckResult.safe) {
    // quarantine
  }
}
```

**Step 3d: Update status to "scanning" → "parsing"**

---

### 2.5 Phase 4: Text Extraction

Before calling the LLM, raw text must be extracted from the file:

**For PDF:**
```ts
import pdfParse from 'pdf-parse';
const data = await pdfParse(fileBuffer);
const rawText = data.text; // plain text string
```

Edge cases:
- **Scanned/image-only PDF**: `data.text` will be empty. Fallback: use Tesseract OCR via `tesseract.js` or the Python service. Mark result with `isOcrExtracted: true`.
- **Encrypted PDF**: Will throw. Catch and set `status: "failed:parse"` with reason `"encrypted_pdf"`.
- **Corrupt PDF**: Handle parse errors gracefully.

**For DOCX:**
```ts
import mammoth from 'mammoth';
const result = await mammoth.extractRawText({ buffer: fileBuffer });
const rawText = result.value;
```

**Text quality checks:**
- If `rawText.trim().length < 100` → likely empty or scanned → attempt OCR fallback
- If OCR also fails → mark as `failed:parse` with `reason: "no_extractable_text"`

---

### 2.6 Phase 5: LLM Parsing (Gemini)

See [`llm-integration.md`](./llm-integration.md) for full prompt design.

**Summary:**
1. Build structured prompt with `rawText`
2. Call Gemini API with `response_mime_type: "application/json"` and the `ResumeFormData` JSON schema
3. Receive structured JSON response
4. Validate response against Zod schema
5. Fill in defaults for missing fields
6. Store as `UploadedResume.parsedData`

---

### 2.7 Phase 6: Hash Storage & Status Update

After successful parse:
```ts
import crypto from 'crypto';
const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
await UploadedResume.findByIdAndUpdate(id, {
  status: 'ready',
  parsedData: structuredData,
  fileHash,
  parsedAt: new Date(),
});
```

Status update triggers the frontend polling to receive `status: "ready"`.

---

## 3. Resume Reuse (No Re-parse)

When the user selects a **previously uploaded resume** that is already in `ready` state:

```
Frontend: User opens Import Modal
  └─ GET /api/uploaded-resumes (list)
     └─ User selects a "ready" resume
        └─ GET /api/uploaded-resumes/:id/data
           └─ Backend returns UploadedResume.parsedData
              └─ Frontend calls hydrateFormFromParsedResume(parsedData)
                 └─ Form auto-fills instantly (no re-upload, no re-parse)
```

The `parsedData` is stored in MongoDB. There is **no re-processing** unless the file changes or the user explicitly requests a re-parse.

---

## 4. Re-upload & Change Detection

When the user replaces a resume file in an existing library slot:

```
Frontend: User clicks "Replace file" on an existing resume
  └─ PUT /api/uploaded-resumes/:id/file (multipart)
     └─ Backend:
        ├─ Compute SHA-256 of new file
        ├─ Compare with stored UploadedResume.fileHash
        │
        ├─ SAME HASH:
        │   └─ Return { changed: false }
        │   └─ Frontend: "File unchanged. Your existing data is up to date."
        │
        └─ DIFFERENT HASH:
            ├─ Upload new file to MinIO (overwrite)
            ├─ Clear parsedData, set status: "uploaded"
            ├─ Enqueue new parse job
            └─ Return { changed: true, status: "uploaded" }
            └─ Frontend: "New version detected! Re-parsing... ~20s"
```

---

## 5. Resume Deletion

When the user deletes an uploaded resume:

```
Frontend: User clicks "Delete" on library item
  └─ DELETE /api/uploaded-resumes/:id
     └─ Backend:
        ├─ Verify ownership (userId must match)
        ├─ Delete file from MinIO
        ├─ Delete UploadedResume document from MongoDB
        └─ Return 200

Side effects:
  - Any SkillPaper resumes that referenced this uploaded resume
    will have their sourceResumeId cleared (null out the reference).
  - The SkillPaper resume data itself is NOT deleted (it's already saved).
```

---

## 6. Form Auto-fill Mapping

The `parsedData` object stored in MongoDB must be mapped to the form's state shape before it can auto-fill. This is done by a new utility function:

**File:** `frontend/src/lib/hydrateFormFromParsedResume.ts`

```ts
export function hydrateFormFromParsedResume(
  parsedData: ParsedResumeData
): ResumeFormState {
  return {
    personalInfo: {
      name: parsedData.name ?? '',
      email: parsedData.email ?? '',
      phone: parsedData.phone ?? '',
      location: parsedData.location ?? '',
      summary: parsedData.summary ?? '',
      links: parsedData.links ?? [],
    },
    education: parsedData.education?.map(edu => ({
      institution: edu.institution ?? '',
      degree: edu.degree ?? '',
      field: edu.field ?? '',
      year: edu.graduationYear ?? '',
      gpa: edu.gpa ?? '',
      description: edu.description ?? '',
    })) ?? [],
    experience: parsedData.experience?.map(exp => ({
      company: exp.company ?? '',
      position: exp.title ?? '',
      duration: `${exp.startDate} – ${exp.endDate ?? 'Present'}`,
      responsibilities: exp.responsibilities ?? [],
      description: exp.description ?? '',
    })) ?? [],
    skills: parsedData.skills ?? [],
    projects: parsedData.projects?.map(proj => ({
      name: proj.name ?? '',
      description: proj.description ?? '',
      technologies: proj.technologies ?? [],
      url: proj.url ?? '',
    })) ?? [],
    languages: parsedData.languages ?? [],
    certifications: parsedData.certifications ?? [],
    achievements: parsedData.achievements ?? [],
    // ... other extras fields
  };
}
```

---

## 7. Handling Multiple Uploaded Resumes

A user may have up to 10 uploaded resumes. The selection flow in the Import Modal:

```
Import Modal
├─ List of user's uploaded resumes (cards)
│   ├─ [✓ Ready]  "Software Engineer Resume" — 3 days ago
│   ├─ [⏳ Parsing] "Product Manager CV" — just uploaded
│   ├─ [✓ Ready]  "Designer Portfolio" — 2 weeks ago
│   └─ [✗ Failed]  "old_scan.pdf" — could not extract text
│
├─ "Upload New Resume" button
│
└─ On select ready resume:
    ├─ Show summary of what will be imported (name, skills count, etc.)
    ├─ "Apply to Form" button
    └─ "Cancel"
```

**Pending resumes** show a disabled select button with a spinner.  
**Failed resumes** show a "Retry" button and an error reason tooltip.

---

## 8. Error Handling & Edge Cases

| Scenario | Behaviour |
|---|---|
| File is malware-infected | Rejected at scan stage, never stored permanently, user notified |
| File is scanned PDF (image-only) | OCR attempted; if OCR also fails, user informed with manual entry fallback |
| Gemini API rate limit hit | Job retried with exponential backoff (3× max); fails gracefully |
| Gemini returns partial data | Partial data stored; empty fields left blank in form; user warned |
| MinIO unreachable | Upload fails with 503; user shown error toast |
| User uploads duplicate (same hash) | Detected server-side; skip re-parse; notify user |
| User deletes resume mid-parse | Job completes but result is discarded (document already deleted) |
| File > 10MB | Rejected at multer level with 413 |
| Unsupported format (e.g., .txt) | Rejected at MIME/magic bytes check with 422 |
| Network drop during upload | Client shows retry option |
