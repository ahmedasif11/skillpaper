# Resume Upload & LLM Auto-fill Feature

> **Feature Codename:** `smart-resume-import`
> **Status:** Planning / Pre-development
> **Last updated:** 2026-08-14

---

## What This Feature Does

This feature allows users of SkillPaper to upload their existing resume files (PDF, DOCX) and have the application **automatically parse them**, extract structured data using **Google Gemini LLM**, and **auto-fill the multi-step resume form** — saving users from manual data entry.

Users can maintain a personal **Resume Library** of uploaded files. The app remembers which resume was parsed, caches the extracted data, and can re-apply it to any template without re-uploading or re-parsing.

---

## Problem Being Solved

Currently, when a user wants to create a resume from a template, they must manually fill in all 6 form steps (personal info, education, experience, skills, projects, extras). This is slow and repetitive, especially for users who:

- Already have a well-written resume in another format
- Want to create multiple versions across different templates
- Have previously filled out forms and want to reuse their data

---

## Core Capabilities

| Capability | Description |
|---|---|
| **Multi-file Resume Library** | Upload and store multiple resume files per user |
| **LLM-powered Parsing** | Gemini extracts structured data matching SkillPaper's schema |
| **Form Auto-fill** | One-click population of all form steps from parsed data |
| **Smart Caching** | Parsed data is stored; re-upload only needed when file changes |
| **Security Scanning** | Files are scanned for malware before processing |
| **Resume Management** | View, rename, delete uploaded resumes; track which is "active" |
| **Change Detection** | Hash-based detection — if same file re-uploaded, skip re-parse |
| **Manual Override** | Auto-filled data is always editable before finalizing |

---

## High-Level User Journey

```
User visits /templates
    └─► Clicks "Try Template"
            └─► Arrives at /resume/form?template=<id>
                    └─► Sees new "Import from Resume" button
                            ├─► Has existing uploaded resumes?
                            │       └─► Select from library → auto-fill form
                            └─► No resumes yet?
                                    └─► Upload new file
                                            ├─► Security scan (OpenCV + ClamAV)
                                            ├─► Parse with Gemini LLM
                                            ├─► Store file in MinIO
                                            ├─► Store parsed data in MongoDB
                                            └─► Auto-fill form → user reviews → submit
```

---

## Documentation Index

| File | Contents |
|---|---|
| [`requirements.md`](./requirements.md) | All functional and non-functional requirements |
| [`architecture.md`](./architecture.md) | System architecture, technology choices, service design |
| [`interfaces-and-adapters.md`](./interfaces-and-adapters.md) | **Ports & Adapters pattern** — all interfaces + swap-in adapters for LLM, storage, scanner, queue, and text extractor |
| [`resume-handling.md`](./resume-handling.md) | Full resume lifecycle: upload → scan → parse → cache → use |
| [`llm-integration.md`](./llm-integration.md) | Gemini LLM integration design, prompts, schema mapping |
| [`ui-ux-flow.md`](./ui-ux-flow.md) | All UI screens, component changes, user flows, edge cases |
| [`api-design.md`](./api-design.md) | New API endpoints, request/response contracts |
| [`data-models.md`](./data-models.md) | New and modified MongoDB schemas |
| [`security.md`](./security.md) | Security scanning, file validation, threat model |
| [`implementation-plan.md`](./implementation-plan.md) | Phased rollout plan with milestones |
| [`backend-audit.md`](./backend-audit.md) | **Current backend audit** — all bugs, security issues, missing tests, and improvements found in the existing codebase |
| [Cursor setup](../../cursor/README.md) | Project rules, skills, and quota-saving workflow for future chats |

---

## Key Technologies Being Added

| Technology | Purpose |
|---|---|
| **Google Gemini API** (`gemini-3.5-flash`) | Resume data extraction and structured output |
| **MinIO** (S3-compatible) | Persistent file storage for uploaded resumes |
| **ClamAV** | Antivirus/malware scanning of uploaded files |
| **OpenCV** (Python microservice) | Image-layer malware detection, steganography checks in image-embedded PDFs |
| **pdf-parse / mammoth** | Pre-processing: extract raw text from PDF/DOCX before LLM |
| **multer** | Multipart file upload handling in Express |
| **sharp** | PDF page image rendering for OpenCV analysis |
| **bull / BullMQ** | Background job queue for async parsing pipelines |
| **Redis** | Job queue backing store + parse-result cache |

---

## Scope Boundaries

### In Scope
- Upload PDF and DOCX resume files
- Gemini-based structured data extraction
- Form auto-fill with user review
- Resume library management (CRUD)
- Cached parsed data reuse
- File malware scanning
- Change detection to avoid redundant re-parsing

### Out of Scope (for this version)
- LinkedIn profile import
- GitHub portfolio import
- AI-powered resume improvement suggestions (future feature)
- Real-time collaborative editing
- Resume version history / diffs
