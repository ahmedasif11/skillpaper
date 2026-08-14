# Data Models

> Feature: Resume Upload & LLM Auto-fill
> Last updated: 2026-08-14

---

## 1. New Model: `UploadedResume`

This is the primary new model. It represents a raw resume file uploaded by the user — separate from the SkillPaper "Resume" model (which is a builder output).

### 1.1 MongoDB Schema

**File:** `backend/src/models/UploadedResume.ts`

```ts
import mongoose, { Schema, Document } from 'mongoose';

export type ParseStatus =
  | 'uploaded'
  | 'scanning'
  | 'parsing'
  | 'ready'
  | 'failed:scan'
  | 'failed:parse';

export interface IUploadedResume extends Document {
  user: mongoose.Types.ObjectId;
  label: string;
  filename: string;
  fileSize: number;
  mimeType: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  minioKey: string;
  fileHash: string | null;
  status: ParseStatus;
  parseError: string | null;
  parsedData: ParsedResumeData | null;
  confidenceScore: number | null;
  isOcrExtracted: boolean;
  parsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UploadedResumeSchema = new Schema<IUploadedResume>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    },
    minioKey: {
      type: String,
      required: true,
    },
    fileHash: {
      type: String,
      default: null,
      // SHA-256 hex of the file content for change detection
    },
    status: {
      type: String,
      required: true,
      enum: ['uploaded', 'scanning', 'parsing', 'ready', 'failed:scan', 'failed:parse'],
      default: 'uploaded',
    },
    parseError: {
      type: String,
      default: null,
      // Human-readable error reason for failed states
    },
    parsedData: {
      type: Schema.Types.Mixed,
      default: null,
      // Stores the full ParsedResumeData JSON object
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    isOcrExtracted: {
      type: Boolean,
      default: false,
      // True if text was extracted via OCR (scanned PDF)
    },
    parsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Ensure a user can't have more than 10 uploaded resumes (enforced in controller too)
UploadedResumeSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IUploadedResume>('UploadedResume', UploadedResumeSchema);
```

---

### 1.2 `ParsedResumeData` TypeScript Interface

This is the shape of the data extracted by Gemini and stored in `parsedData`.

**File:** `backend/src/types/parsedResume.ts`

```ts
export interface ParsedResumeLink {
  label?: string;
  url: string;
}

export interface ParsedResumeEducation {
  institution: string;
  degree: string;
  field?: string;
  graduationYear?: string;
  gpa?: string;
  description?: string;
}

export interface ParsedResumeExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  responsibilities?: string[];
  description?: string;
}

export interface ParsedResumeProject {
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
  date?: string;
}

export interface ParsedResumeCertification {
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
}

export interface ParsedResumeLanguage {
  name: string;
  proficiency?: 'Native' | 'Fluent' | 'Professional' | 'Conversational' | 'Basic';
}

export interface ParsedResumeAchievement {
  title: string;
  description?: string;
  date?: string;
}

export interface ParsedResumeData {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  links?: ParsedResumeLink[];
  education?: ParsedResumeEducation[];
  experience?: ParsedResumeExperience[];
  skills?: string[];
  softSkills?: string[];
  tools?: string[];
  projects?: ParsedResumeProject[];
  certifications?: ParsedResumeCertification[];
  languages?: ParsedResumeLanguage[];
  achievements?: ParsedResumeAchievement[];
}
```

---

## 2. Modified Model: `Resume` (Existing)

The existing `Resume` model gets one new optional field to track which uploaded source resume was used to populate it.

**File:** `backend/src/models/Resume.ts` — add field:

```ts
// Existing Resume model — add this field:
sourceUploadedResumeId: {
  type: Schema.Types.ObjectId,
  ref: 'UploadedResume',
  default: null,
  // Set when the user imported from an uploaded resume
}
```

This creates a soft link between a SkillPaper resume and its source. When the uploaded resume is deleted, this is set to `null` (orphaned reference is acceptable).

---

## 3. Frontend TypeScript Types

**File:** `frontend/src/types/index.ts` — add:

```ts
export type ParseStatus =
  | 'uploaded'
  | 'scanning'
  | 'parsing'
  | 'ready'
  | 'failed:scan'
  | 'failed:parse';

export interface UploadedResumeSummary {
  skillsCount: number;
  experienceCount: number;
  educationCount: number;
  projectsCount: number;
}

export interface UploadedResume {
  id: string;
  label: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: ParseStatus;
  parseError: string | null;
  confidenceScore: number | null;
  isOcrExtracted: boolean;
  summary?: UploadedResumeSummary;
  parsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedResumeLink {
  label?: string;
  url: string;
}

export interface ParsedResumeEducation {
  institution: string;
  degree: string;
  field?: string;
  graduationYear?: string;
  gpa?: string;
  description?: string;
}

export interface ParsedResumeExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  responsibilities?: string[];
  description?: string;
}

export interface ParsedResumeProject {
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
  date?: string;
}

export interface ParsedResumeCertification {
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
}

export interface ParsedResumeLanguage {
  name: string;
  proficiency?: string;
}

export interface ParsedResumeAchievement {
  title: string;
  description?: string;
  date?: string;
}

export interface ParsedResumeData {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  links?: ParsedResumeLink[];
  education?: ParsedResumeEducation[];
  experience?: ParsedResumeExperience[];
  skills?: string[];
  softSkills?: string[];
  tools?: string[];
  projects?: ParsedResumeProject[];
  certifications?: ParsedResumeCertification[];
  languages?: ParsedResumeLanguage[];
  achievements?: ParsedResumeAchievement[];
}

export interface UploadedResumeWithData extends UploadedResume {
  parsedData: ParsedResumeData | null;
}
```

---

## 4. BullMQ Job Payload

**File:** `backend/src/types/jobs.ts`

```ts
export interface ParseResumeJobData {
  uploadedResumeId: string;
  userId: string;
  minioKey: string;
  mimeType: string;
  attempt: number;
}

export interface ParseResumeJobResult {
  success: boolean;
  parsedData?: ParsedResumeData;
  confidenceScore?: number;
  fileHash?: string;
  error?: string;
}
```

---

## 5. Database Indexes

For performance, the following indexes should be created:

```ts
// UploadedResume collection indexes
db.uploadedresumes.createIndex({ user: 1, createdAt: -1 })     // list by user, sorted by date
db.uploadedresumes.createIndex({ user: 1, status: 1 })          // filter by user + status
db.uploadedresumes.createIndex({ user: 1, fileHash: 1 })        // change detection lookup

// Resume collection — add to existing
db.resumes.createIndex({ sourceUploadedResumeId: 1 })           // find resumes by source (for cascade nullify)
```

---

## 6. Storage Structure (MinIO)

```
Bucket: skillpaper-resumes
│
└── {userId}/
    └── {uploadedResumeId}/
        └── {originalFilename}        ← e.g. my_resume.pdf
```

**Example:**
```
skillpaper-resumes/
└── 64f3c2a1.../
    └── 64f9d3b2.../
        └── ahmed_cv_2025.pdf
```

Object metadata stored with MinIO upload:
```json
{
  "x-amz-meta-user-id": "64f3c2a1...",
  "x-amz-meta-uploaded-resume-id": "64f9d3b2...",
  "x-amz-meta-original-name": "ahmed_cv_2025.pdf",
  "x-amz-meta-upload-date": "2026-08-14T15:30:00Z"
}
```

---

## 7. Summary: What's New vs Modified

| Item | Type | Change |
|---|---|---|
| `UploadedResume` model | New | Full new MongoDB model + TypeScript interface |
| `ParsedResumeData` type | New | TS interface for Gemini output + form mapping |
| `UploadedResume` (frontend) | New | Frontend TS type for API responses |
| `ParseResumeJobData` | New | BullMQ job payload types |
| `Resume` model | Modified | Add `sourceUploadedResumeId` field |
| `src/types/index.ts` (frontend) | Modified | Add all new TS interfaces |
| MinIO bucket structure | New | `skillpaper-resumes` bucket layout |
