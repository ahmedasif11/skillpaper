import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { resumeUpload } from '../middlewares/upload';
import {
  deleteUploadedResume,
  listUploadedResumes,
  uploadResume,
} from '../controllers/uploadedResume.controller';

const router = express.Router();

router.post('/', authMiddleware, resumeUpload, uploadResume);
router.get('/', authMiddleware, listUploadedResumes);
router.delete('/:id', authMiddleware, deleteUploadedResume);

export default router;
