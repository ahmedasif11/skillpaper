// src/validation/template.validation.ts
import Joi from 'joi';

export const createTemplateSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(100),
  description: Joi.string().optional().trim().max(500),
  category: Joi.string().optional().trim().max(50),
  preview: Joi.string().optional().allow(''),
  html: Joi.string().required().min(1),
  isActive: Joi.boolean().optional().default(true),
});
