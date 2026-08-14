import type { ILlmService } from './interfaces/ILlmService';
import type { IStorageService } from './interfaces/IStorageService';
import type { IScannerService } from './interfaces/IScannerService';
import type { ITextExtractor } from './interfaces/ITextExtractor';
import type { IQueueService } from './interfaces/IQueueService';
import type { ParseJobPayload } from './interfaces/types';

import { GeminiLlmAdapter } from './adapters/llm/geminiLlm.adapter';
import { MockLlmAdapter } from './adapters/llm/mockLlm.adapter';
import { MinioStorageAdapter } from './adapters/storage/minioStorage.adapter';
import { MockStorageAdapter } from './adapters/storage/mockStorage.adapter';
import { ClamavScannerAdapter } from './adapters/scanner/clamavScanner.adapter';
import { MockScannerAdapter } from './adapters/scanner/mockScanner.adapter';
import { PdfMammothExtractorAdapter } from './adapters/extract/pdfMammothExtractor.adapter';
import { MockExtractorAdapter } from './adapters/extract/mockExtractor.adapter';
import { BullmqQueueAdapter } from './adapters/queue/bullmqQueue.adapter';
import { InMemoryQueueAdapter } from './adapters/queue/inMemoryQueue.adapter';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

let llm: ILlmService | undefined;
let storage: IStorageService | undefined;
let scanner: IScannerService | undefined;
let extractor: ITextExtractor | undefined;
let queue: IQueueService | undefined;

export function getLlm(): ILlmService {
  if (!llm) {
    switch (process.env.LLM_PROVIDER ?? 'gemini') {
      case 'mock':
        llm = new MockLlmAdapter();
        break;
      case 'gemini':
        llm = new GeminiLlmAdapter({
          apiKey: process.env.GEMINI_API_KEY,
          model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
        });
        break;
      default:
        throw new Error(`Unknown LLM_PROVIDER=${process.env.LLM_PROVIDER}`);
    }
  }
  return llm;
}

export function getStorage(): IStorageService {
  if (!storage) {
    switch (process.env.STORAGE_PROVIDER ?? 'minio') {
      case 'mock':
        storage = new MockStorageAdapter();
        break;
      case 'minio':
        storage = new MinioStorageAdapter({
          endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
          port: Number(process.env.MINIO_PORT ?? 9000),
          useSSL: process.env.MINIO_USE_SSL === 'true',
          accessKey: requireEnv('MINIO_ACCESS_KEY'),
          secretKey: requireEnv('MINIO_SECRET_KEY'),
          bucket: process.env.MINIO_BUCKET_NAME ?? 'skillpaper-resumes',
        });
        break;
      default:
        throw new Error(
          `Unknown STORAGE_PROVIDER=${process.env.STORAGE_PROVIDER}`
        );
    }
  }
  return storage;
}

export function getScanner(): IScannerService {
  if (!scanner) {
    switch (process.env.SCANNER_PROVIDER ?? 'clamav') {
      case 'mock':
        scanner = new MockScannerAdapter();
        break;
      case 'clamav':
        scanner = new ClamavScannerAdapter({
          host: process.env.CLAMAV_HOST ?? 'localhost',
          port: Number(process.env.CLAMAV_PORT ?? 3310),
          opencvBaseUrl: process.env.OPENCV_SERVICE_URL ?? 'http://localhost:8001',
        });
        break;
      default:
        throw new Error(
          `Unknown SCANNER_PROVIDER=${process.env.SCANNER_PROVIDER}`
        );
    }
  }
  return scanner;
}

export function getTextExtractor(): ITextExtractor {
  if (!extractor) {
    switch (process.env.EXTRACTOR_PROVIDER ?? 'pdf-mammoth') {
      case 'mock':
        extractor = new MockExtractorAdapter();
        break;
      case 'pdf-mammoth':
        extractor = new PdfMammothExtractorAdapter();
        break;
      default:
        throw new Error(
          `Unknown EXTRACTOR_PROVIDER=${process.env.EXTRACTOR_PROVIDER}`
        );
    }
  }
  return extractor;
}

export function getQueue(): IQueueService {
  if (!queue) {
    switch (process.env.QUEUE_PROVIDER ?? 'bullmq') {
      case 'memory':
        queue = new InMemoryQueueAdapter(async (payload: ParseJobPayload) => {
          const { runParseJob } = await import('./workers/parseResume.worker');
          await runParseJob(payload);
        });
        break;
      case 'bullmq':
        queue = new BullmqQueueAdapter({
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        });
        break;
      default:
        throw new Error(
          `Unknown QUEUE_PROVIDER=${process.env.QUEUE_PROVIDER}`
        );
    }
  }
  return queue;
}

export function startParseWorker(): void {
  if ((process.env.QUEUE_PROVIDER ?? 'bullmq') !== 'bullmq') {
    return;
  }
  const q = getQueue();
  if (q instanceof BullmqQueueAdapter) {
    void import('./workers/parseResume.worker').then(({ runParseJob }) => {
      q.startWorker(runParseJob);
    });
  }
}

export function resetContainerForTests(): void {
  llm = undefined;
  storage = undefined;
  scanner = undefined;
  extractor = undefined;
  queue = undefined;
}
