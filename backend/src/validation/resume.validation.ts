// src/validation/resume.validation.ts
import Joi from 'joi';

const optionalUrl = Joi.string()
  .optional()
  .custom((value) => {
    if (!value) return value;
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    return `https://${value}`;
  });

/** Shared resume `data` object. Single top-level `location`; nested location only on experience/education items. */
export const resumeDataSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  phone: Joi.string().required().min(10).max(20),
  location: Joi.string().optional().max(200),
  website: optionalUrl,
  linkedin: optionalUrl,
  github: optionalUrl,

  summary: Joi.string().required().min(20).max(1000),
  title: Joi.string().optional().max(100),
  tagline: Joi.string().optional().max(200),

  experience: Joi.array()
    .items(
      Joi.object({
        company: Joi.string().required().max(100),
        position: Joi.string().required().max(100),
        duration: Joi.string().required().max(50),
        location: Joi.string().optional().max(100),
        responsibilities: Joi.array().items(Joi.string().max(500)).optional(),
        achievements: Joi.array().items(Joi.string().max(200)).optional(),
        technologies: Joi.array().items(Joi.string().max(50)).optional(),
      })
    )
    .optional(),

  education: Joi.array()
    .items(
      Joi.object({
        institution: Joi.string().required().max(100),
        degree: Joi.string().required().max(100),
        field: Joi.string().optional().max(100),
        year: Joi.string().required().max(50),
        location: Joi.string().optional().max(100),
        achievements: Joi.array().items(Joi.string().max(200)).optional(),
      })
    )
    .optional(),

  skills: Joi.array()
    .items(
      Joi.object({
        category: Joi.string().required().max(50),
        items: Joi.array().items(Joi.string().max(50)).required().min(1),
        proficiency: Joi.string()
          .valid('Beginner', 'Intermediate', 'Advanced', 'Expert')
          .optional(),
      })
    )
    .optional(),

  technicalSkills: Joi.string().optional().max(500),
  softSkills: Joi.string().optional().max(500),
  languagesString: Joi.string().optional().max(200),
  certificationsString: Joi.string().optional().max(500),
  tools: Joi.string().optional().max(500),
  additionalInfo: Joi.array().items(Joi.string().max(500)).optional(),
  achievements: Joi.array().items(Joi.string().max(500)).optional(),

  projects: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().max(100),
        description: Joi.string().required().min(20).max(500),
        technologies: Joi.array().items(Joi.string().max(50)).optional(),
        url: optionalUrl,
        github: optionalUrl,
        startDate: Joi.date().optional(),
        endDate: Joi.date().optional(),
        achievements: Joi.array().items(Joi.string().max(200)).optional(),
      })
    )
    .optional(),

  languages: Joi.array()
    .items(
      Joi.object({
        language: Joi.string().required().max(50),
        proficiency: Joi.string()
          .valid(
            'Beginner',
            'Elementary',
            'Intermediate',
            'Advanced',
            'Fluent',
            'Native'
          )
          .required(),
        certification: Joi.string().optional().max(100),
      })
    )
    .optional(),

  references: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().max(100),
        position: Joi.string().required().max(100),
        company: Joi.string().required().max(100),
        email: Joi.string().email().required(),
        phone: Joi.string().optional().max(20),
        relationship: Joi.string().optional().max(100),
      })
    )
    .optional(),

  additionalSections: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required().max(100),
        content: Joi.string().required().min(10).max(1000),
        type: Joi.string().valid('text', 'list', 'timeline').optional(),
      })
    )
    .optional(),
});

const CREATE_REQUIRED_DATA_KEYS = ['name', 'email', 'phone', 'summary'];

export const createResumeSchema = Joi.object({
  templateId: Joi.string().required(),
  data: resumeDataSchema.required(),
});

export const updateResumeSchema = Joi.object({
  data: resumeDataSchema
    .fork(CREATE_REQUIRED_DATA_KEYS, (schema) => schema.optional())
    .required(),
});

export const shareResumeSchema = Joi.object({
  expiresInDays: Joi.number().integer().min(1).max(365).optional().default(30),
});
