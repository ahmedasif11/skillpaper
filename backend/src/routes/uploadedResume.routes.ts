import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { resumeUpload } from '../middlewares/upload';
import {
  deleteUploadedResume,
  getUploadedResume,
  getUploadedResumeData,
  getUploadedResumeStatus,
  listUploadedResumes,
  replaceUploadedResumeFile,
  reparseUploadedResume,
  uploadResume,
} from '../controllers/uploadedResume.controller';

const router = express.Router();

router.post('/', authMiddleware, resumeUpload, uploadResume);
router.get('/', authMiddleware, listUploadedResumes);
router.get('/:id/status', authMiddleware, getUploadedResumeStatus);
router.get('/:id/data', authMiddleware, getUploadedResumeData);
router.post('/:id/reparse', authMiddleware, reparseUploadedResume);
router.put('/:id/file', authMiddleware, resumeUpload, replaceUploadedResumeFile);
router.get('/:id', authMiddleware, getUploadedResume);
router.delete('/:id', authMiddleware, deleteUploadedResume);

export default router;
