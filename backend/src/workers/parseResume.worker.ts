import { createHash } from 'crypto';
import UploadedResume from '../models/UploadedResume';
import {
  getLlm,
  getScanner,
  getStorage,
  getTextExtractor,
} from '../container';
import { isExtractError } from '../interfaces/ExtractError';
import type { ParseJobPayload, ResumeMime } from '../interfaces/types';
import {
  computeConfidenceScore,
  validateAndNormalise,
} from '../services/resumeParser.normalise';

export const PARSE_ERROR_ENCRYPTED_PDF =
  'This PDF is password-protected. Remove the password and upload it again.';
export const PARSE_ERROR_UNREADABLE_PDF =
  'This PDF is unreadable or damaged. Upload a valid file or enter details manually.';
export const PARSE_ERROR_NO_TEXT =
  'No extractable text found. You can retry with a different file or enter details manually.';

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function runParseJob(payload: ParseJobPayload): Promise<void> {
  const doc = await UploadedResume.findById(payload.uploadedResumeId);
  if (!doc) {
    return;
  }
  if (String(doc.user) !== String(payload.userId)) {
    console.warn(
      'Parse job user mismatch',
      payload.uploadedResumeId,
      payload.userId
    );
    return;
  }

  const storage = getStorage();
  const buffer = await storage.get(payload.objectKey);
  const fileHash = sha256(buffer);

  if (doc.status === 'ready' && doc.parsedData && doc.fileHash === fileHash) {
    return;
  }

  doc.status = 'scanning';
  doc.parseError = null;
  await doc.save();

  try {
    const scanner = getScanner();
    const mimeType = doc.mimeType as ResumeMime;
    const scan = await scanner.scan({ buffer, mimeType });

    if (!scan.safe) {
      try {
        await storage.delete(payload.objectKey);
      } catch (err) {
        console.error('Failed to delete unsafe object', payload.objectKey, err);
      }
      doc.status = 'failed:scan';
      doc.parseError = 'File blocked: potential security threat detected';
      doc.parsedData = null;
      doc.confidenceScore = null;
      doc.parsedAt = null;
      await doc.save();
      console.warn('Malware detected on uploaded resume', {
        userId: payload.userId,
        uploadedResumeId: payload.uploadedResumeId,
      });
      return;
    }

    doc.status = 'parsing';
    doc.fileHash = fileHash;
    await doc.save();

    const extracted = await getTextExtractor().extract({ buffer, mimeType });
    if (!extracted.text.trim()) {
      doc.status = 'failed:parse';
      doc.parseError = PARSE_ERROR_NO_TEXT;
      doc.isOcrExtracted = false;
      await doc.save();
      return;
    }

    const llmOut = await getLlm().parseResume({ rawText: extracted.text });
    const parsedData = validateAndNormalise(llmOut.data);
    const confidenceScore = computeConfidenceScore(parsedData);

    doc.parsedData = parsedData;
    doc.confidenceScore = confidenceScore;
    doc.fileHash = fileHash;
    doc.parsedAt = new Date();
    doc.parseError = null;
    doc.isOcrExtracted = extracted.isOcrExtracted === true;
    doc.status = 'ready';
    await doc.save();
  } catch (err) {
    if (isExtractError(err) && err.code === 'encrypted_pdf') {
      doc.status = 'failed:parse';
      doc.parseError = PARSE_ERROR_ENCRYPTED_PDF;
      doc.isOcrExtracted = false;
      await doc.save();
      return;
    }
    if (isExtractError(err) && err.code === 'unreadable_pdf') {
      doc.status = 'failed:parse';
      doc.parseError = PARSE_ERROR_UNREADABLE_PDF;
      doc.isOcrExtracted = false;
      await doc.save();
      return;
    }
    console.error('Parse pipeline failed', payload.uploadedResumeId, err);
    const scanning = doc.status === 'scanning';
    doc.status = scanning ? 'failed:scan' : 'failed:parse';
    doc.parseError = scanning
      ? 'Security scan is unavailable. Retry in a minute, or enter details manually.'
      : 'Failed to parse resume. You can retry or enter details manually.';
    await doc.save();
  }
}
