# Ports & Adapters — LLM, Storage, Scanner, Queue, Text

> Feature: Resume Upload & LLM Auto-fill
> Last updated: 2026-08-14

This is the source of truth for **how** SkillPaper talks to vendors. Controllers and workers must not import Gemini, MinIO, ClamAV, or BullMQ SDKs.

Related: [`architecture.md`](./architecture.md) §6, skill `ports-and-adapters`.

---

## 1. Golden rule

| Layer | May import |
|---|---|
| Controllers, workers, domain services | `backend/src/interfaces/*` and the **container** (`getStorage()`, etc.) |
| Adapters | Vendor SDKs + the matching interface |
| `container.ts` | Interfaces **and** adapters (the only file that names vendors) |

Never: `uploadedResume.controller.ts` → `@google/generative-ai` / `minio` / `clamscan`.

Swap vendor = new adapter file + one change in `container.ts` (or env). No controller edits.

---

## 2. Layout

```
backend/src/interfaces/          # ports only (no SDK types leaking)
  ILlmService.ts
  IStorageService.ts
  IScannerService.ts
  ITextExtractor.ts
  IQueueService.ts
  types.ts                      # shared DTOs used by ports

backend/src/adapters/
  llm/
    geminiLlm.adapter.ts        # default
    openaiLlm.adapter.ts        # optional later
    mockLlm.adapter.ts          # tests
  storage/
    minioStorage.adapter.ts     # default
    s3Storage.adapter.ts        # optional later
    mockStorage.adapter.ts
  scanner/
    clamavScanner.adapter.ts    # default (ClamAV + HTTP OpenCV)
    mockScanner.adapter.ts
  extract/
    pdfMammothExtractor.adapter.ts
    mockExtractor.adapter.ts
  queue/
    bullmqQueue.adapter.ts
    inMemoryQueue.adapter.ts    # tests / local without Redis

backend/src/container.ts         # wire adapters from env
```

Architecture’s `src/services/storage.service.ts` names are **legacy**. Implement as **adapters** under `adapters/`. Thin facades in `services/` are optional; if used, they must only call ports from the container.

Parse pipeline orchestration (`parseResume.worker.ts`) calls ports, not SDKs.

---

## 3. Shared types (`interfaces/types.ts`)

```ts
export type ResumeMime =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface StoredObject {
  key: string;
  bucket: string;
  size: number;
}

export interface ScanFinding {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ScanResult {
  safe: boolean;
  engine: 'clamav' | 'opencv' | 'composite' | 'mock';
  score?: number;
  findings: ScanFinding[];
}

export interface ExtractResult {
  text: string;
  pageCount?: number;
  isLikelyScannedPdf: boolean; // little/no text → OCR later
}

export interface ParseJobPayload {
  uploadedResumeId: string;
  userId: string;
  objectKey: string;
}

export interface LlmParseInput {
  rawText: string;
  preferHigherQuality?: boolean; // Flash vs Pro in Gemini adapter
}

export interface LlmParseOutput {
  data: unknown; // validated by resumeParser.normalise.ts, not the port
  model: string;
  rawResponseText?: string;
}
```

Ports return `unknown` / DTOs. Zod lives in `resumeParser.normalise.ts`, not inside `ILlmService`.

---

## 4. Ports

### 4.1 `ILlmService`

```ts
export interface ILlmService {
  parseResume(input: LlmParseInput): Promise<LlmParseOutput>;
}
```

- **Default adapter:** Gemini (`GEMINI_API_KEY`, `GEMINI_MODEL`).
- Adapter owns retries/429 backoff and optional Pro fallback (`llm-integration.md` §8).
- Must not write MongoDB or MinIO.

### 4.2 `IStorageService`

```ts
export interface IStorageService {
  put(params: {
    key: string;
    body: Buffer;
    contentType: ResumeMime;
  }): Promise<StoredObject>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  presignGet(key: string, expiresSeconds: number): Promise<string>;
}
```

- **Default:** MinIO, bucket `MINIO_BUCKET_NAME` (e.g. `skillpaper-resumes`).
- Keys: `{userId}/{uploadedResumeId}/{safeFilename}` — never raw user filenames (`security.md`).
- **Later:** AWS S3 adapter, same interface.

### 4.3 `IScannerService`

```ts
export interface IScannerService {
  scan(params: { buffer: Buffer; mimeType: ResumeMime }): Promise<ScanResult>;
}
```

Default adapter **orchestrates**:

1. ClamAV (`CLAMAV_HOST` / `CLAMAV_PORT`)
2. If PDF: POST page images to OpenCV service (`OPENCV_SERVICE_URL`) — HTTP client belongs in this adapter (or a private helper), not the worker

Worker: `const result = await scanner.scan(...)`; if `!result.safe` → status `failed:scan`, delete object, stop.

Do not call OpenCV from the controller.

### 4.4 `ITextExtractor`

```ts
export interface ITextExtractor {
  extract(params: { buffer: Buffer; mimeType: ResumeMime }): Promise<ExtractResult>;
}
```

- PDF → `pdf-parse`
- DOCX → `mammoth`
- Encrypted / empty text: throw a typed error or return `text: ''` + `isLikelyScannedPdf: true` (OCR is Phase 4)

### 4.5 `IQueueService`

```ts
export interface IQueueService {
  enqueueParse(payload: ParseJobPayload): Promise<{ jobId: string }>;
}
```

- **Default:** BullMQ + Redis (`REDIS_HOST` / `REDIS_PORT`), queue name `resume-parse`, 3 attempts, exponential backoff.
- Worker process registers the processor; producer only enqueues.
- Tests: `inMemoryQueue.adapter.ts` runs the handler inline.

---

## 5. `container.ts`

```ts
import type { ILlmService } from './interfaces/ILlmService';
import type { IStorageService } from './interfaces/IStorageService';
import type { IScannerService } from './interfaces/IScannerService';
import type { ITextExtractor } from './interfaces/ITextExtractor';
import type { IQueueService } from './interfaces/IQueueService';

import { GeminiLlmAdapter } from './adapters/llm/geminiLlm.adapter';
import { MockLlmAdapter } from './adapters/llm/mockLlm.adapter';
import { MinioStorageAdapter } from './adapters/storage/minioStorage.adapter';
import { MockStorageAdapter } from './adapters/storage/mockStorage.adapter';
import { ClamavScannerAdapter } from './adapters/scanner/clamavScanner.adapter';
import { MockScannerAdapter } from './adapters/scanner/mockScanner.adapter';
import { PdfMammothExtractorAdapter } from './adapters/extract/pdfMammothExtractor.adapter';
import { BullmqQueueAdapter } from './adapters/queue/bullmqQueue.adapter';
import { InMemoryQueueAdapter } from './adapters/queue/inMemoryQueue.adapter';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export function getLlm(): ILlmService {
  switch (process.env.LLM_PROVIDER ?? 'gemini') {
    case 'mock':
      return new MockLlmAdapter();
    case 'gemini':
      return new GeminiLlmAdapter({
        apiKey: requireEnv('GEMINI_API_KEY'),
        model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
      });
    default:
      throw new Error(`Unknown LLM_PROVIDER=${process.env.LLM_PROVIDER}`);
  }
}

export function getStorage(): IStorageService {
  switch (process.env.STORAGE_PROVIDER ?? 'minio') {
    case 'mock':
      return new MockStorageAdapter();
    case 'minio':
      return new MinioStorageAdapter({
        endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
        port: Number(process.env.MINIO_PORT ?? 9000),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: requireEnv('MINIO_ACCESS_KEY'),
        secretKey: requireEnv('MINIO_SECRET_KEY'),
        bucket: process.env.MINIO_BUCKET_NAME ?? 'skillpaper-resumes',
      });
    default:
      throw new Error(`Unknown STORAGE_PROVIDER=${process.env.STORAGE_PROVIDER}`);
  }
}

export function getScanner(): IScannerService {
  switch (process.env.SCANNER_PROVIDER ?? 'clamav') {
    case 'mock':
      return new MockScannerAdapter();
    case 'clamav':
      return new ClamavScannerAdapter({
        host: process.env.CLAMAV_HOST ?? 'localhost',
        port: Number(process.env.CLAMAV_PORT ?? 3310),
        opencvBaseUrl: process.env.OPENCV_SERVICE_URL ?? 'http://localhost:8001',
      });
    default:
      throw new Error(`Unknown SCANNER_PROVIDER=${process.env.SCANNER_PROVIDER}`);
  }
}

export function getTextExtractor(): ITextExtractor {
  return new PdfMammothExtractorAdapter();
}

export function getQueue(): IQueueService {
  switch (process.env.QUEUE_PROVIDER ?? 'bullmq') {
    case 'memory':
      return new InMemoryQueueAdapter(/* parse handler */);
    case 'bullmq':
      return new BullmqQueueAdapter({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      });
    default:
      throw new Error(`Unknown QUEUE_PROVIDER=${process.env.QUEUE_PROVIDER}`);
  }
}
```

Phase 1 may use **mock LLM** (`LLM_PROVIDER=mock`) so upload → store → scan → queue → status works without Gemini.

---

## 6. Environment

| Variable | Role |
|---|---|
| `LLM_PROVIDER` | `gemini` \| `mock` (\| `openai` later) |
| `STORAGE_PROVIDER` | `minio` \| `mock` (\| `s3` later) |
| `SCANNER_PROVIDER` | `clamav` \| `mock` |
| `QUEUE_PROVIDER` | `bullmq` \| `memory` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini adapter |
| `MINIO_*` | MinIO adapter |
| `CLAMAV_HOST`, `CLAMAV_PORT` | ClamAV |
| `OPENCV_SERVICE_URL` | Image scan HTTP |
| `REDIS_HOST`, `REDIS_PORT` | BullMQ |

Add these to `backend/.env.example`. Fail startup if the **selected** provider is missing required secrets (e.g. Gemini selected but no key). Mock providers must not require cloud keys.

---

## 7. Worker usage (pattern)

```ts
import { getStorage, getScanner, getTextExtractor, getLlm } from '../container';

export async function runParseJob(payload: ParseJobPayload): Promise<void> {
  const storage = getStorage();
  const scanner = getScanner();
  const extractor = getTextExtractor();
  const llm = getLlm();

  const buffer = await storage.get(payload.objectKey);
  const scan = await scanner.scan({ buffer, mimeType: /* from DB */ });
  if (!scan.safe) {
    await storage.delete(payload.objectKey);
    // set UploadedResume status failed:scan
    return;
  }
  const extracted = await extractor.extract({ buffer, mimeType: /* ... */ });
  const llmOut = await llm.parseResume({ rawText: extracted.text });
  // validateAndNormalise(llmOut.data) then save
}
```

Upload handler: validate file → `storage.put` → insert `UploadedResume` → `queue.enqueueParse`.

---

## 8. Mock adapters (required for tests)

| Mock | Behavior |
|---|---|
| `MockLlmAdapter` | Returns a fixture `ParsedResumeData`-shaped object |
| `MockStorageAdapter` | `Map<string, Buffer>` in memory |
| `MockScannerAdapter` | `safe: true` unless filename/buffer contains `EICAR` |
| `InMemoryQueueAdapter` | `await handler(payload)` immediately |

Integration tests set `LLM_PROVIDER=mock` (etc.) or inject via a test-only `setContainer()` if you add one. Prefer env + process isolation over hidden singletons if tests run in-band.

---

## 9. Optional adapters (do not build until asked)

| Port | Adapter | When |
|---|---|---|
| `ILlmService` | OpenAI | `LLM_PROVIDER=openai` |
| `ILlmService` | Ollama | Privacy / local |
| `IStorageService` | S3 / R2 | Production cloud |
| `IScannerService` | VirusTotal | Extra reputation (rate-limited, paid) |

Each is a new file + a `case` in `container.ts`.

---

## 10. OpenCV microservice

Not a TypeScript port. Python FastAPI at `services/opencv-service/`, `POST /scan-images`. The **ClamAV scanner adapter** is the HTTP client. Worker still only sees `IScannerService`.

Contract (align with `architecture.md`):

```json
{ "safe": true, "score": 0.12, "findings": [] }
```

---

## 11. Phase mapping

| Phase | Ports to implement |
|---|---|
| 1 | All **interfaces** + `container.ts` with MinIO, ClamAV (or mock scanner), BullMQ, extractor; **mock LLM** OK |
| 2 | Real `GeminiLlmAdapter`; OpenCV inside scanner adapter |
| Tests | Mock / memory adapters |

Do not put Gemini SDK in Phase 1 controllers “just for now.”
