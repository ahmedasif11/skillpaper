# API Design

> Feature: Resume Upload & LLM Auto-fill
> Last updated: 2026-08-14

All new endpoints are mounted under `/api/uploaded-resumes`. All require JWT authentication unless noted.

---

## 1. Endpoint Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/uploaded-resumes` | ✓ | Upload a new resume file |
| `GET` | `/api/uploaded-resumes` | ✓ | List user's uploaded resumes |
| `GET` | `/api/uploaded-resumes/:id` | ✓ | Get metadata for one uploaded resume |
| `GET` | `/api/uploaded-resumes/:id/status` | ✓ | Get just the current parse status (for polling) |
| `GET` | `/api/uploaded-resumes/:id/data` | ✓ | Get the parsed structured data (when ready) |
| `GET` | `/api/uploaded-resumes/:id/download` | ✓ | Get a pre-signed URL to download the original file |
| `PUT` | `/api/uploaded-resumes/:id` | ✓ | Update label/name of uploaded resume |
| `PUT` | `/api/uploaded-resumes/:id/file` | ✓ | Replace the file (triggers change detection + re-parse) |
| `POST` | `/api/uploaded-resumes/:id/reparse` | ✓ | Manually trigger a re-parse |
| `DELETE` | `/api/uploaded-resumes/:id` | ✓ | Delete uploaded resume + file from MinIO |

---

## 2. Detailed Endpoint Specifications

---

### `POST /api/uploaded-resumes`

**Description:** Upload a new resume file. Triggers security scan + parse as background jobs.

**Auth:** Required (JWT Bearer token)

**Request:**
```
Content-Type: multipart/form-data

Fields:
  file    (File, required)   — PDF or DOCX, max 10 MB
  label   (string, optional) — User-defined name, max 100 chars. Defaults to filename.
```

**Validation:**
- File MIME type must be `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- File size ≤ 10 MB
- User quota: ≤ 10 uploaded resumes

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "64f3c2a1b4e5d6789012abcd",
    "label": "Software Engineer Resume",
    "filename": "my_resume.pdf",
    "fileSize": 245760,
    "mimeType": "application/pdf",
    "status": "uploaded",
    "createdAt": "2026-08-14T15:30:00.000Z"
  }
}
```

**Error Responses:**

| Code | Reason |
|---|---|
| `400` | Missing file |
| `413` | File exceeds 10 MB |
| `415` | Unsupported file type |
| `422` | File content doesn't match declared type (magic bytes fail) |
| `429` | User quota exceeded (10 resumes max) |

---

### `GET /api/uploaded-resumes`

**Description:** List all uploaded resumes belonging to the authenticated user.

**Auth:** Required

**Query params:**
- `status` (optional) — filter by status: `ready`, `parsing`, `failed:parse`, etc.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f3c2a1b4e5d6789012abcd",
      "label": "Software Engineer Resume",
      "filename": "my_resume.pdf",
      "fileSize": 245760,
      "status": "ready",
      "parsedAt": "2026-08-10T12:00:00.000Z",
      "confidenceScore": 85,
      "summary": {
        "skillsCount": 8,
        "experienceCount": 3,
        "educationCount": 2,
        "projectsCount": 5
      },
      "createdAt": "2026-08-10T11:45:00.000Z",
      "updatedAt": "2026-08-10T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### `GET /api/uploaded-resumes/:id`

**Description:** Get full metadata for a single uploaded resume.

**Auth:** Required (must own the resource)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "64f3c2a1b4e5d6789012abcd",
    "label": "Software Engineer Resume",
    "filename": "my_resume.pdf",
    "fileSize": 245760,
    "mimeType": "application/pdf",
    "status": "ready",
    "parseError": null,
    "confidenceScore": 85,
    "isOcrExtracted": false,
    "parsedAt": "2026-08-10T12:00:00.000Z",
    "createdAt": "2026-08-10T11:45:00.000Z",
    "updatedAt": "2026-08-10T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Code | Reason |
|---|---|
| `404` | Resume not found |
| `403` | Resume belongs to another user |

---

### `GET /api/uploaded-resumes/:id/status`

**Description:** Lightweight polling endpoint — returns only the status field plus a progress hint. Designed to be polled every 3 seconds.

**Auth:** Required

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "64f3c2a1b4e5d6789012abcd",
    "status": "parsing",
    "progressHint": "AI is reading your resume...",
    "estimatedSecondsRemaining": 12
  }
}
```

Possible `status` values:
- `"uploaded"` — queued, not yet started
- `"scanning"` — ClamAV + OpenCV running
- `"parsing"` — Gemini extraction running
- `"ready"` — complete
- `"failed:scan"` — malware detected
- `"failed:parse"` — extraction failed

---

### `GET /api/uploaded-resumes/:id/data`

**Description:** Returns the full parsed `ResumeFormData` structure. Only available when `status === "ready"`.

**Auth:** Required

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "parsedData": {
      "name": "Ahmed Asif",
      "email": "ahmed@example.com",
      "phone": "+92 300 1234567",
      "location": "Lahore, Pakistan",
      "summary": "Full-stack developer with 3 years of experience...",
      "links": [
        { "label": "GitHub", "url": "https://github.com/ahmed-asif" },
        { "label": "LinkedIn", "url": "https://linkedin.com/in/ahmed-asif" }
      ],
      "experience": [
        {
          "company": "Tech Corp",
          "title": "Software Engineer",
          "startDate": "Jan 2023",
          "endDate": "Present",
          "responsibilities": [
            "Built RESTful APIs using Node.js and Express",
            "Reduced page load time by 40% via code splitting"
          ]
        }
      ],
      "education": [...],
      "skills": ["React", "Node.js", "MongoDB", "TypeScript"],
      "softSkills": ["Communication", "Problem Solving"],
      "tools": ["VS Code", "Git", "Docker"],
      "projects": [...],
      "certifications": [...],
      "languages": [
        { "name": "English", "proficiency": "Fluent" },
        { "name": "Urdu", "proficiency": "Native" }
      ],
      "achievements": [...]
    },
    "confidenceScore": 85,
    "isOcrExtracted": false,
    "parsedAt": "2026-08-10T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Code | Reason |
|---|---|
| `404` | Resume not found |
| `409` | Resume is not yet in "ready" state |

---

### `GET /api/uploaded-resumes/:id/download`

**Description:** Generate a pre-signed MinIO URL to download the original uploaded file.

**Auth:** Required

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "url": "http://minio:9000/skillpaper-resumes/userId/resumeId/my_resume.pdf?X-Amz-Signature=...",
    "expiresIn": 3600,
    "filename": "my_resume.pdf"
  }
}
```

---

### `PUT /api/uploaded-resumes/:id`

**Description:** Update the label/name of an uploaded resume (metadata only, no file change).

**Auth:** Required

**Request body:**
```json
{
  "label": "New Resume Label"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "64f3c2a1b4e5d6789012abcd",
    "label": "New Resume Label",
    "updatedAt": "2026-08-14T10:00:00.000Z"
  }
}
```

---

### `PUT /api/uploaded-resumes/:id/file`

**Description:** Replace the uploaded file. Triggers change detection. If the file is different, clears parsed data and enqueues a new parse job.

**Auth:** Required

**Request:**
```
Content-Type: multipart/form-data

Fields:
  file    (File, required)   — PDF or DOCX, max 10 MB
```

**Response `200 OK` — file unchanged (same hash):**
```json
{
  "success": true,
  "data": {
    "changed": false,
    "message": "File is identical to the current version. No re-processing needed.",
    "status": "ready"
  }
}
```

**Response `200 OK` — file changed (different hash):**
```json
{
  "success": true,
  "data": {
    "changed": true,
    "message": "New version detected. Re-parsing in progress.",
    "status": "uploaded"
  }
}
```

---

### `POST /api/uploaded-resumes/:id/reparse`

**Description:** Manually trigger a re-parse of an already-uploaded file. Useful if the previous parse failed or produced low-quality results. Does NOT require re-uploading the file.

**Auth:** Required

**Conditions:** Only allowed when `status` is `"ready"`, `"failed:parse"`. Not allowed during active scan/parse.

**Request body:** (empty)

**Response `202 Accepted`:**
```json
{
  "success": true,
  "data": {
    "message": "Re-parse job enqueued.",
    "status": "uploaded"
  }
}
```

---

### `DELETE /api/uploaded-resumes/:id`

**Description:** Delete an uploaded resume. Removes from MongoDB and MinIO.

**Auth:** Required

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "message": "Uploaded resume deleted successfully."
  }
}
```

**Side effects:**
- File deleted from MinIO
- `UploadedResume` document deleted from MongoDB
- Any `Resume` documents with `sourceUploadedResumeId` matching this ID will have that field set to `null`

---

## 3. Error Response Format

All errors follow the existing SkillPaper error format:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "code": "OPTIONAL_ERROR_CODE"
}
```

Common error codes for this feature:

| Code | Meaning |
|---|---|
| `QUOTA_EXCEEDED` | User has reached the 10 resume limit |
| `MALWARE_DETECTED` | File failed security scan |
| `UNSUPPORTED_FORMAT` | File type not allowed |
| `FILE_TOO_LARGE` | File exceeds 10 MB |
| `PARSE_NOT_READY` | Requested data before parsing is complete |
| `REPARSE_IN_PROGRESS` | Cannot trigger reparse when one is already running |
| `STORAGE_ERROR` | MinIO upload/delete failed |

---

## 4. Status Polling Contract

The frontend must poll `GET /api/uploaded-resumes/:id/status` every 3 seconds after upload:

```ts
// Pseudo-code: useParseStatus hook
const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATES = ['ready', 'failed:scan', 'failed:parse'];

async function pollStatus(id: string, onUpdate: (status: string) => void) {
  const interval = setInterval(async () => {
    const { data } = await uploadedResumesAPI.getStatus(id);
    onUpdate(data.status);
    if (TERMINAL_STATES.includes(data.status)) {
      clearInterval(interval);
    }
  }, POLL_INTERVAL_MS);
  return () => clearInterval(interval); // cleanup
}
```

**Maximum poll duration:** 5 minutes (100 polls). After that, show a "Taking longer than expected" message with a manual refresh button.

---

## 5. Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/uploaded-resumes` | 5 uploads | per minute per user |
| `POST /api/uploaded-resumes/:id/reparse` | 3 requests | per hour per resume |
| `GET /api/uploaded-resumes/:id/status` | 60 requests | per minute per user |
| All other GET endpoints | 100 requests | per minute per user |
