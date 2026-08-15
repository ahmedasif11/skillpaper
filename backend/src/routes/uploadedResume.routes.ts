import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { resumeUpload } from '../middlewares/upload';
import {
  deleteUploadedResume,
  downloadUploadedResume,
  getUploadedResume,
  getUploadedResumeData,
  getUploadedResumeStatus,
  listUploadedResumes,
  replaceUploadedResumeFile,
  reparseUploadedResume,
  updateUploadedResumeLabel,
  uploadResume,
} from '../controllers/uploadedResume.controller';

const router = express.Router();

router.post('/', authMiddleware, resumeUpload, uploadResume);
router.get('/', authMiddleware, listUploadedResumes);
router.get('/:id/status', authMiddleware, getUploadedResumeStatus);
router.get('/:id/data', authMiddleware, getUploadedResumeData);
router.get('/:id/download', authMiddleware, downloadUploadedResume);
router.post('/:id/reparse', authMiddleware, reparseUploadedResume);
router.put('/:id/file', authMiddleware, resumeUpload, replaceUploadedResumeFile);
router.put('/:id', authMiddleware, updateUploadedResumeLabel);
router.get('/:id', authMiddleware, getUploadedResume);
router.delete('/:id', authMiddleware, deleteUploadedResume);

export default router;
