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

const router = express.Router();

router.get('/', listTemplates);
router.get('/:id', getTemplate);
// protect createTemplate — requires auth (you can extend for admin)
router.post(
  '/',
  authMiddleware,
  validate(createTemplateSchema),
  createTemplate
);

export default router;
