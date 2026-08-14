import path from 'path';
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import type { ResumeMime } from '../interfaces/types';

export const ALLOWED_RESUME_MIMES = new Set<ResumeMime>([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOADED_RESUMES_PER_USER = 10;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_RESUME_MIMES.has(file.mimetype as ResumeMime)) {
      const err = new Error(
        'Unsupported file type. Only PDF and DOCX are allowed.'
      ) as Error & { code?: string; status?: number };
      err.code = 'UNSUPPORTED_FORMAT';
      err.status = 415;
      cb(err);
      return;
    }
    cb(null, true);
  },
});

export function resumeUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  upload.single('file')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          success: false,
          message: 'File exceeds 10 MB',
          code: 'FILE_TOO_LARGE',
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: err.message,
      });
      return;
    }
    if (err && typeof err === 'object' && 'status' in err) {
      const typed = err as Error & { status: number; code?: string };
      res.status(typed.status).json({
        success: false,
        message: typed.message,
        code: typed.code ?? 'UNSUPPORTED_FORMAT',
      });
      return;
    }
    if (err) {
      next(err);
      return;
    }
    next();
  });
}

export function validateMagicBytes(
  buffer: Buffer,
  declaredMime: string
): boolean {
  if (declaredMime === 'application/pdf') {
    return buffer.subarray(0, 4).toString('ascii') === '%PDF';
  }
  if (declaredMime.includes('wordprocessingml')) {
    return (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    );
  }
  return false;
}

export function displayFilename(originalName: string): string {
  const base = path.basename(originalName || 'resume').replace(/[/\\]/g, '');
  const cleaned = base.replace(/[^\w.\- ()]/g, '_').trim();
  return (cleaned || 'resume').slice(0, 200);
}

export function safeStoredFilename(
  mimeType: ResumeMime,
  id: string
): string {
  const ext = mimeType === 'application/pdf' ? '.pdf' : '.docx';
  return `resume_${id}${ext}`;
}

export function storageKey(
  userId: string,
  uploadedResumeId: string,
  storedFilename: string
): string {
  return `${userId}/${uploadedResumeId}/${storedFilename}`;
}
