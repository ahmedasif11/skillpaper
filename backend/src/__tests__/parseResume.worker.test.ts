import mongoose from 'mongoose';
import { MockStorageAdapter } from '../adapters/storage/mockStorage.adapter';
import { getStorage, setTextExtractorForTests } from '../container';
import { ExtractError } from '../interfaces/ExtractError';
import type { ITextExtractor } from '../interfaces/ITextExtractor';
import type { ExtractResult, ResumeMime } from '../interfaces/types';
import UploadedResume from '../models/UploadedResume';
import {
  PARSE_ERROR_ENCRYPTED_PDF,
  PARSE_ERROR_NO_TEXT,
  PARSE_ERROR_UNREADABLE_PDF,
  runParseJob,
} from '../workers/parseResume.worker';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n%%EOF\n');

function extractorReturning(result: ExtractResult): ITextExtractor {
  return {
    extract: async () => result,
  };
}

function extractorThrowing(err: Error): ITextExtractor {
  return {
    extract: async () => {
      throw err;
    },
  };
}

async function seedUploadedPdf() {
  const userId = new mongoose.Types.ObjectId();
  const objectKey = `${userId.toString()}/r1/cv.pdf`;
  const storage = getStorage() as MockStorageAdapter;
  await storage.put({
    key: objectKey,
    body: PDF,
    contentType: 'application/pdf',
  });
  const doc = await UploadedResume.create({
    user: userId,
    label: 'CV',
    filename: 'cv.pdf',
    fileSize: PDF.length,
    mimeType: 'application/pdf' satisfies ResumeMime,
    minioKey: objectKey,
    status: 'uploaded',
  });
  return {
    userId: String(userId),
    uploadedResumeId: String(doc._id),
    objectKey,
  };
}

describe('runParseJob OCR and encrypted PDF (Phase 4)', () => {
  it('marks isOcrExtracted when the extractor used OCR', async () => {
    setTextExtractorForTests(
      extractorReturning({
        text: 'OCR extracted resume of Jane Doe with experience and skills listed here for parsing.',
        pageCount: 1,
        isLikelyScannedPdf: true,
        isOcrExtracted: true,
      })
    );
    const payload = await seedUploadedPdf();
    await runParseJob(payload);

    const doc = await UploadedResume.findById(payload.uploadedResumeId);
    expect(doc?.status).toBe('ready');
    expect(doc?.isOcrExtracted).toBe(true);
    expect(doc?.parsedData).toBeTruthy();
    expect(doc?.parseError).toBeNull();
  });

  it('sets failed:parse for encrypted PDFs with a clear error', async () => {
    setTextExtractorForTests(
      extractorThrowing(
        new ExtractError(
          'encrypted_pdf',
          'This PDF is password-protected. Remove the password and upload it again.'
        )
      )
    );
    const payload = await seedUploadedPdf();
    await runParseJob(payload);

    const doc = await UploadedResume.findById(payload.uploadedResumeId);
    expect(doc?.status).toBe('failed:parse');
    expect(doc?.parseError).toBe(PARSE_ERROR_ENCRYPTED_PDF);
    expect(doc?.isOcrExtracted).toBe(false);
    expect(doc?.parsedData).toBeNull();
  });

  it('sets failed:parse for unreadable PDFs with a clear error', async () => {
    setTextExtractorForTests(
      extractorThrowing(
        new ExtractError(
          'unreadable_pdf',
          'This PDF is unreadable or damaged. Upload a valid file or enter details manually.'
        )
      )
    );
    const payload = await seedUploadedPdf();
    await runParseJob(payload);

    const doc = await UploadedResume.findById(payload.uploadedResumeId);
    expect(doc?.status).toBe('failed:parse');
    expect(doc?.parseError).toBe(PARSE_ERROR_UNREADABLE_PDF);
    expect(doc?.isOcrExtracted).toBe(false);
    expect(doc?.parsedData).toBeNull();
  });

  it('sets failed:parse when OCR and text extraction both yield nothing', async () => {
    setTextExtractorForTests(
      extractorReturning({
        text: '',
        pageCount: 1,
        isLikelyScannedPdf: true,
        isOcrExtracted: false,
      })
    );
    const payload = await seedUploadedPdf();
    await runParseJob(payload);

    const doc = await UploadedResume.findById(payload.uploadedResumeId);
    expect(doc?.status).toBe('failed:parse');
    expect(doc?.parseError).toBe(PARSE_ERROR_NO_TEXT);
    expect(doc?.isOcrExtracted).toBe(false);
  });
});
