import UploadedResume from '../models/UploadedResume';
import { getScanner, getStorage } from '../container';
import type { ParseJobPayload } from '../interfaces/types';
import type { ResumeMime } from '../interfaces/types';

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

  doc.status = 'scanning';
  doc.parseError = null;
  await doc.save();

  const storage = getStorage();
  const scanner = getScanner();
  const buffer = await storage.get(payload.objectKey);
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
    await doc.save();
    console.warn('Malware detected on uploaded resume', {
      userId: payload.userId,
      uploadedResumeId: payload.uploadedResumeId,
    });
    return;
  }

  // Phase 2: extract text + Gemini. Keep status moving so the pipeline is visible.
  doc.status = 'parsing';
  await doc.save();
}
