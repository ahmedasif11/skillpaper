# UI/UX Flow Design

> Feature: Resume Upload & LLM Auto-fill
> Last updated: 2026-08-14

---

## 1. Entry Points

This feature is accessible from **two places** in the app:

| Entry Point | Path | Trigger |
|---|---|---|
| Dashboard | `/dashboard` | "My Uploaded Resumes" section |
| Form Page | `/resume/form?template=<id>` | "Import from Resume" button |

---

## 2. Dashboard — Resume Library Section

### 2.1 Layout

The dashboard gets a new section below "Your Resumes":

```
┌──────────────────────────────────────────────────────────────────┐
│  📁 My Uploaded Resumes                          [Upload New ↑]  │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │ 📄 SW Eng Resume    │  │ 📄 Product Manager  │  [+ Upload]   │
│  │ Uploaded 3 days ago │  │ ⏳ Parsing...        │               │
│  │ ✓ Ready to use      │  │ Est. ~20s remaining │               │
│  │                     │  │                     │               │
│  │ [Use] [↓] [Delete]  │  │       [Cancel]      │               │
│  └─────────────────────┘  └─────────────────────┘               │
│                                                                  │
│  No uploaded resumes yet? Upload your existing CV to auto-fill  │
│  any template form in seconds.                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Resume Card States

| State | Visual | Actions |
|---|---|---|
| `ready` | Green dot + "Ready to use" | [Use in Form], [Download original], [Delete] |
| `parsing` | Spinner + "Parsing..." | [Cancel] |
| `scanning` | Shield icon + "Scanning for safety..." | [Cancel] |
| `uploaded` | Clock icon + "Queued..." | [Cancel] |
| `failed:parse` | Red dot + "Parse failed" + reason | [Retry Parse], [Delete] |
| `failed:scan` | Red shield + "Security threat detected" | [Delete] |

### 2.3 Upload New Resume Flow

Clicking "Upload New" opens the **Upload Panel** (bottom sheet on mobile, dialog on desktop):

```
┌───────────────────────────────────────────┐
│  Upload Resume                         ✕  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │                                     │  │
│  │   📎 Drag & drop your resume here   │  │
│  │                                     │  │
│  │   PDF or DOCX — max 10 MB           │  │
│  │                                     │  │
│  │         [Choose File]               │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Label (optional)                         │
│  ┌─────────────────────────────────────┐  │
│  │ e.g. "Software Engineer Resume"     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│              [Upload & Parse →]           │
│                                           │
│  ℹ️  Your resume will be processed by    │
│  Gemini AI. See our Privacy Policy.       │
└───────────────────────────────────────────┘
```

**Upload progress states:**

```
[Uploading...    ████████░░░░  60%]
[Scanning...     ██████████░░  Safety check]
[Parsing...      AI is reading your resume  ~15s]
[✓ Ready!        Applied to form            ]
```

---

## 3. Form Page — "Import from Resume" Button

### 3.1 Button Placement

The button is placed at the top of the form, just below the template header and progress bar:

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back        Resume Form        Template: Modern Clean    │
│  ─────────────────────────────────────────────────────────  │
│  ● ○ ○ ○ ○ ○   Personal Info                               │
│  ─────────────────────────────────────────────────────────  │
│  [💾 Save Draft]  [👁 Preview]   [📥 Import from Resume ▾] │ ← NEW
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [ Personal Info Form Fields ... ]                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Import Modal — Has Existing Resumes

When the user has parsed resumes in their library:

```
┌──────────────────────────────────────────────────────────────┐
│  Import from Resume                                       ✕  │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  Select a resume to auto-fill all form fields:              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📄 Software Engineer Resume          ✓ Ready        │   │
│  │  Uploaded Aug 10, 2026                               │   │
│  │  Found: 8 skills · 3 jobs · 2 education · 5 projects │   │
│  │                                               [Select]│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📄 Old CV                            ✓ Ready        │   │
│  │  Uploaded Jul 25, 2026                               │   │
│  │  Found: 5 skills · 2 jobs · 1 education · 0 projects │   │
│  │                                               [Select]│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  Or upload a new resume ↓                                    │
│  [📎 Upload New File]                                        │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Import Modal — No Existing Resumes

```
┌──────────────────────────────────────────────────────────────┐
│  Import from Resume                                       ✕  │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│            📎                                               │
│     No uploaded resumes yet                                  │
│     Upload your existing CV to auto-fill this form          │
│                                                              │
│         [Upload Your Resume →]                               │
│                                                              │
│  Supported formats: PDF, DOCX · Max size: 10 MB             │
└──────────────────────────────────────────────────────────────┘
```

### 3.4 Import Preview Confirmation

After selecting a resume, show a preview of what will be imported before applying:

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back   Confirm Import                                     │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  From: "Software Engineer Resume"                            │
│                                                              │
│  ✓  Personal Info    Ahmed Asif · ahmed@email.com            │
│  ✓  Experience       3 jobs (Google, Meta, Startup)          │
│  ✓  Education        BS Computer Science, 2022               │
│  ✓  Skills           React, Node.js, Python (+5 more)        │
│  ✓  Projects         5 projects                              │
│  ⚠  Extras           No certifications found                 │
│                                                              │
│  Confidence: ████████░░  85% — Good                         │
│                                                              │
│  ⚠️  This will replace any data you've already entered.     │
│                                                              │
│  [Cancel]                    [Apply to Form →]               │
└──────────────────────────────────────────────────────────────┘
```

### 3.5 After Auto-fill Applied

The form is populated. A banner appears at the top:

```
┌──────────────────────────────────────────────────────────────┐
│  ✓ Form filled from "Software Engineer Resume"               │
│  Review and edit any field before saving.  [Clear import ✕] │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Upload Inside Form (Inline Upload Flow)

When the user selects "Upload New File" from within the form modal, the upload and parse happens inline. The modal stays open and shows the progress:

```
Step 1: File selected → immediate UI feedback
┌──────────────────────────────────────────────────────────────┐
│  ← Cancel Upload                                             │
│                                                              │
│  📄 my_resume.pdf   2.4 MB                                   │
│                                                              │
│  [████████████████░░░░░░░░]  Uploading...  60%              │
└──────────────────────────────────────────────────────────────┘

Step 2: Scanning
┌──────────────────────────────────────────────────────────────┐
│  🛡 Scanning for safety...                                    │
│  This usually takes a few seconds.                           │
└──────────────────────────────────────────────────────────────┘

Step 3: Parsing
┌──────────────────────────────────────────────────────────────┐
│  🤖 AI is reading your resume...                             │
│  Extracting skills, experience, and education.  ~20s        │
│                                                              │
│  [████████████░░░░░░░░░░░░]  ~15 seconds remaining          │
└──────────────────────────────────────────────────────────────┘

Step 4: Ready → automatically transitions to preview confirmation
┌──────────────────────────────────────────────────────────────┐
│  ✓ Resume parsed successfully!                               │
│  Found: 8 skills · 3 jobs · 2 education                     │
│  Confidence: 85%                                             │
│                                                              │
│                        [Apply to Form →]                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Resume Library Management Page (Optional — Phase 2)

A dedicated page at `/resume-library` for full management:

```
┌──────────────────────────────────────────────────────────────┐
│  My Resume Library                                           │
│  ─────────────────────────────────────────────────────────   │
│  Manage your uploaded resumes. These are used to auto-fill  │
│  form templates.                         [Upload New +]      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Name          │ Status │ Uploaded    │ Actions      │    │
│  │  ─────────────────────────────────────────────────  │    │
│  │  SW Eng Resume │ ✓ Ready│ Aug 10, 26  │ [↓][✏][🗑]  │    │
│  │  Old CV        │ ✓ Ready│ Jul 25, 26  │ [↓][✏][🗑]  │    │
│  │  Design CV     │ ⏳ Parse│ Aug 14, 26  │ [...]        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  3 of 10 slots used                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Component Map

```
src/components/resume-import/
├── ImportModal.tsx          # Main modal container — shows library list
├── UploadResumePanel.tsx    # Drag-and-drop upload UI
├── ParseStatusBadge.tsx     # Status indicator (scanning/parsing/ready/failed)
├── ResumeLibraryList.tsx    # List of uploaded resumes inside modal
├── ResumeLibraryCard.tsx    # Individual card in the list
├── ImportPreview.tsx        # Confirmation screen before applying
└── InlineUploadProgress.tsx # Upload + parse progress inside the modal

src/app/dashboard/
└── _components/
    └── UploadedResumesSection.tsx   # New section in dashboard

src/hooks/
├── useUploadedResumes.ts     # CRUD for uploaded resumes
└── useParseStatus.ts         # Polling hook for parse status
```

---

## 7. Mobile Experience

- Upload panel: full-screen bottom sheet
- Import modal: full-screen drawer
- Resume library cards: single column with swipe-to-delete
- Progress indicators: simplified (just icon + text, no progress bar)
- File selection: native file picker (no drag-and-drop on mobile)

---

## 8. Accessibility

| Requirement | Implementation |
|---|---|
| Upload area keyboard accessible | `role="button"`, `tabIndex={0}`, `onKeyDown` Enter/Space handler |
| Progress announced to screen readers | `aria-live="polite"` region for status updates |
| Error messages associated with inputs | `aria-describedby` linking error text to upload trigger |
| Modal focus trap | Standard dialog focus management (Radix Dialog already handles this) |
| Color not the only indicator | Status uses icon + text + color (never color alone) |

---

## 9. State Management

The import feature uses local React state + server polling (no global state store needed):

```ts
// useParseStatus.ts
// Polls GET /api/uploaded-resumes/:id/status every 3 seconds
// until status is "ready" or "failed:*"
// Auto-stops polling on cleanup

// useUploadedResumes.ts
// wraps uploadedResumesAPI calls
// manages loading/error/data states
// exposes: resumes, isLoading, error, upload(), delete(), refetch()
```

---

## 10. Toast Notifications

| Event | Toast |
|---|---|
| Upload started | (none — progress bar visible in modal) |
| Scan complete | (silent — progress continues) |
| Parse complete | "✓ Resume parsed! Ready to apply." (success) |
| Parse failed | "⚠ Could not parse resume. Please check the file or try again." (error) |
| Malware detected | "🚫 File blocked: potential security threat detected." (error, persistent) |
| Auto-fill applied | "✓ Form filled from [Resume Name]" (success) |
| Import cleared | "Form data cleared." (info) |
| Delete success | "Resume deleted." (info) |
| Quota reached | "You've reached the 10 resume limit. Delete one to upload more." (warning) |
