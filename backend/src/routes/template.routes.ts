// src/routes/template.routes.ts
import express from 'express';
import {
  listTemplates,
  getTemplate,
  createTemplate,
} from '../controllers/template.controller';
import { validate } from '../middlewares/validate';
import { createTemplateSchema } from '../validation/template.validation';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = express.Router();

router.get('/', listTemplates);
router.get('/:id', getTemplate);
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  validate(createTemplateSchema),
  createTemplate
);

export default router;
