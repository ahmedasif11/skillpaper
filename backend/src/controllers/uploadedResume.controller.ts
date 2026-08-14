import { createHash } from 'crypto';
import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import UploadedResume, {
  type ParseStatus,
} from '../models/UploadedResume';
import Resume from '../models/Resume';
import { getQueue, getStorage } from '../container';
import { isValidObjectId } from '../utils/objectId';
import { isResumeOwner } from '../utils/assertResumeOwner';
import type { ResumeMime } from '../interfaces/types';
import type { ParsedResumeData } from '../types/parsedResume';
import {
  ALLOWED_RESUME_MIMES,
  MAX_UPLOADED_RESUMES_PER_USER,
  displayFilename,
  safeStoredFilename,
  storageKey,
  validateMagicBytes,
} from '../middlewares/upload';

const PARSE_STATUSES: ParseStatus[] = [
  'uploaded',
  'scanning',
  'parsing',
  'ready',
  'failed:scan',
  'failed:parse',
];

function fail(
  res: Response,
  status: number,
  message: string,
  code?: string
) {
  return res.status(status).json({
    success: false,
    message,
    ...(code ? { code } : {}),
  });
}

function summaryFromParsed(data: ParsedResumeData | null | undefined) {
  return {
    skillsCount: data?.skills?.length ?? 0,
    experienceCount: data?.experience?.length ?? 0,
    educationCount: data?.education?.length ?? 0,
    projectsCount: data?.projects?.length ?? 0,
  };
}

async function loadOwnedUploadedResume(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    fail(res, 401, 'Unauthorized');
    return null;
  }

  const { id } = req.params;
  if (!isValidObjectId(id)) {
    fail(res, 400, 'Invalid uploaded resume id');
    return null;
  }

  const doc = await UploadedResume.findById(id);
  if (!doc) {
    fail(res, 404, 'Uploaded resume not found');
    return null;
  }

  if (!isResumeOwner(doc, String(user._id))) {
    fail(res, 403, 'Access denied');
    return null;
  }

  return doc;
}

/**
 * POST /api/uploaded-resumes
 */
export const uploadResume = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return fail(res, 401, 'Unauthorized');

    const file = req.file;
    if (!file) {
      return fail(res, 400, 'Missing file');
    }

    const mimeType = file.mimetype as ResumeMime;
    if (!ALLOWED_RESUME_MIMES.has(mimeType)) {
      return fail(
        res,
        415,
        'Unsupported file type. Only PDF and DOCX are allowed.',
        'UNSUPPORTED_FORMAT'
      );
    }

    if (!validateMagicBytes(file.buffer, mimeType)) {
      return fail(
        res,
        422,
        'File content does not match the declared type',
        'UNSUPPORTED_FORMAT'
      );
    }

    const rawLabel =
      typeof req.body?.label === 'string' ? req.body.label.trim() : '';
    if (rawLabel.length > 100) {
      return fail(res, 400, 'Label must be at most 100 characters');
    }

    const count = await UploadedResume.countDocuments({ user: user._id });
    if (count >= MAX_UPLOADED_RESUMES_PER_USER) {
      return fail(
        res,
        429,
        'You have reached the maximum of 10 uploaded resumes',
        'QUOTA_EXCEEDED'
      );
    }

    const uploadedResumeId = new mongoose.Types.ObjectId();
    const filename = displayFilename(file.originalname);
    const label = rawLabel || filename.slice(0, 100);
    const storedName = safeStoredFilename(mimeType, String(uploadedResumeId));
    const objectKey = storageKey(
      String(user._id),
      String(uploadedResumeId),
      storedName
    );
    const fileHash = createHash('sha256').update(file.buffer).digest('hex');

    const storage = getStorage();
    try {
      await storage.put({
        key: objectKey,
        body: file.buffer,
        contentType: mimeType,
      });
    } catch (err) {
      console.error('Storage put failed', err);
      return fail(res, 500, 'Failed to store uploaded file', 'STORAGE_ERROR');
    }

    try {
      const doc = await UploadedResume.create({
        _id: uploadedResumeId,
        user: user._id,
        label,
        filename,
        fileSize: file.size,
        mimeType,
        minioKey: objectKey,
        fileHash,
        status: 'uploaded',
      });

      await getQueue().enqueueParse({
        uploadedResumeId: String(doc._id),
        userId: String(user._id),
        objectKey,
      });

      return res.status(201).json({
        success: true,
        data: {
          id: String(doc._id),
          label: doc.label,
          filename: doc.filename,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          status: doc.status,
          createdAt: doc.createdAt,
        },
      });
    } catch (err) {
      try {
        await storage.delete(objectKey);
      } catch (cleanupErr) {
        console.error('Orphan object cleanup failed', objectKey, cleanupErr);
      }
      throw err;
    }
  } catch (err) {
    console.error('Upload resume error:', err);
    return fail(res, 500, 'Server error');
  }
};

/**
 * GET /api/uploaded-resumes
 */
export const listUploadedResumes = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return fail(res, 401, 'Unauthorized');

    const filter: { user: unknown; status?: ParseStatus } = { user: user._id };
    const status = req.query.status;
    if (typeof status === 'string' && status.length > 0) {
      if (!PARSE_STATUSES.includes(status as ParseStatus)) {
        return fail(res, 400, 'Invalid status filter');
      }
      filter.status = status as ParseStatus;
    }

    const docs = await UploadedResume.find(filter).sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: docs.map((doc) => ({
        id: String(doc._id),
        label: doc.label,
        filename: doc.filename,
        fileSize: doc.fileSize,
        status: doc.status,
        parsedAt: doc.parsedAt,
        confidenceScore: doc.confidenceScore,
        summary: summaryFromParsed(doc.parsedData),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      total: docs.length,
    });
  } catch (err) {
    console.error('List uploaded resumes error:', err);
    return fail(res, 500, 'Server error');
  }
};

/**
 * DELETE /api/uploaded-resumes/:id
 */
export const deleteUploadedResume = async (req: Request, res: Response) => {
  try {
    const doc = await loadOwnedUploadedResume(req, res);
    if (!doc) return;

    const storage = getStorage();
    try {
      await storage.delete(doc.minioKey);
    } catch (err) {
      console.error('Storage delete failed', doc.minioKey, err);
      return fail(res, 500, 'Failed to delete stored file', 'STORAGE_ERROR');
    }

    await UploadedResume.deleteOne({ _id: doc._id });
    await Resume.updateMany(
      { sourceUploadedResumeId: doc._id },
      { $set: { sourceUploadedResumeId: null } }
    );

    return res.json({
      success: true,
      data: {
        message: 'Uploaded resume deleted successfully.',
      },
    });
  } catch (err) {
    console.error('Delete uploaded resume error:', err);
    return fail(res, 500, 'Server error');
  }
};
