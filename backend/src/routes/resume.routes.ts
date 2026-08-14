// src/routes/resume.routes.ts
import express from 'express';
import {
  createResume,
  getResume,
  getUserResumes,
  downloadResume,
  regenerateResumePdf,
  previewResumePdf,
  updateResume,
  deleteResume,
  cleanupOldPdfsEndpoint,
  shareResume,
  unshareResume,
  getPublicResume,
  downloadPublicResume,
} from '../controllers/resume.controller';
import { validate } from '../middlewares/validate';
import {
  createResumeSchema,
  updateResumeSchema,
  shareResumeSchema,
} from '../validation/resume.validation';
import { authMiddleware } from '../middlewares/authMiddleware';
import { pdfLimiter } from '../middlewares/rateLimit';

const router = express.Router();

// create resume (protected)
router.post(
  '/',
  pdfLimiter,
  authMiddleware,
  validate(createResumeSchema),
  createResume
);

// get user resumes (protected)
router.get('/user', authMiddleware, getUserResumes);

// cleanup old PDFs (authenticated + CLEANUP_TOKEN)
router.post('/cleanup', authMiddleware, cleanupOldPdfsEndpoint);

// get resume (protected)
router.get('/:id', authMiddleware, getResume);

// update resume (protected)
router.put('/:id', authMiddleware, validate(updateResumeSchema), updateResume);

// delete resume (protected)
router.delete('/:id', authMiddleware, deleteResume);

// regenerate PDF (protected)
router.post(
  '/:id/regenerate',
  pdfLimiter,
  authMiddleware,
  regenerateResumePdf
);

// preview PDF (protected)
router.get('/:id/preview', pdfLimiter, authMiddleware, previewResumePdf);

// download pdf (protected)
router.get('/:id/download', authMiddleware, downloadResume);

// share resume (protected)
router.post(
  '/:id/share',
  authMiddleware,
  validate(shareResumeSchema),
  shareResume
);

// unshare resume (protected)
router.post('/:id/unshare', authMiddleware, unshareResume);

// public routes (no auth required)
router.get('/public/:shareToken', getPublicResume);
router.get('/public/:shareToken/download', downloadPublicResume);

export default router;
