// src/validation/resume.validation.ts
import Joi from 'joi';

export const createResumeSchema = Joi.object({
  templateId: Joi.string().required(),
  data: Joi.object({
    // Personal Information
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    phone: Joi.string().required().min(10).max(20),
    location: Joi.string().optional().max(200),
    website: Joi.string()
      .optional()
      .custom((value, helpers) => {
        if (!value) return value;
        // Allow URLs with or without protocol
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
        // Auto-add https:// if no protocol
        return `https://${value}`;
      }),
    linkedin: Joi.string()
      .optional()
      .custom((value, helpers) => {
        if (!value) return value;
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
        return `https://${value}`;
      }),
    github: Joi.string()
      .optional()
      .custom((value, helpers) => {
        if (!value) return value;
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
        return `https://${value}`;
      }),

    // Professional Summary
    summary: Joi.string().required().min(20).max(1000),
    title: Joi.string().optional().max(100),
    tagline: Joi.string().optional().max(200),

    // Work Experience
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

    // Education
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

    // Skills - Support both old and new format
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

    // Additional skill fields for template compatibility
    technicalSkills: Joi.string().optional().max(500),
    softSkills: Joi.string().optional().max(500),
    languagesString: Joi.string().optional().max(200),
    certificationsString: Joi.string().optional().max(500),
    tools: Joi.string().optional().max(500),
    additionalInfo: Joi.array().items(Joi.string().max(500)).optional(),
    achievements: Joi.array().items(Joi.string().max(500)).optional(),

    // Projects
    projects: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required().max(100),
          description: Joi.string().required().min(20).max(500),
          technologies: Joi.array().items(Joi.string().max(50)).optional(),
          url: Joi.string()
            .optional()
            .custom((value, helpers) => {
              if (!value) return value;
              if (value.startsWith('http://') || value.startsWith('https://')) {
                return value;
              }
              return `https://${value}`;
            }),
          github: Joi.string()
            .optional()
            .custom((value, helpers) => {
              if (!value) return value;
              if (value.startsWith('http://') || value.startsWith('https://')) {
                return value;
              }
              return `https://${value}`;
            }),
          startDate: Joi.date().optional(),
          endDate: Joi.date().optional(),
          achievements: Joi.array().items(Joi.string().max(200)).optional(),
        })
      )
      .optional(),

    // Languages
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

    // References
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

    // Additional Sections
    additionalSections: Joi.array()
      .items(
        Joi.object({
          title: Joi.string().required().max(100),
          content: Joi.string().required().min(10).max(1000),
          type: Joi.string().valid('text', 'list', 'timeline').optional(),
        })
      )
      .optional(),
  }).required(),
});

export const shareResumeSchema = Joi.object({
  expiresInDays: Joi.number().integer().min(1).max(365).optional().default(30),
});

export const updateResumeSchema = Joi.object({
  data: Joi.object({
    // Same validation as createResumeSchema but all fields optional
    name: Joi.string().optional().min(2).max(100),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional().min(10).max(20),
    location: Joi.string().optional().max(200),
    website: Joi.string()
      .optional()
      .custom((value, helpers) => {
        if (!value) return value;
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
        return `https://${value}`;
      }),
    linkedin: Joi.string()
      .optional()
      .custom((value, helpers) => {
        if (!value) return value;
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
        return `https://${value}`;
      }),
    github: Joi.string()
      .optional()
      .custom((value, helpers) => {
        if (!value) return value;
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
        return `https://${value}`;
      }),
    summary: Joi.string().optional().min(20).max(1000),
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

    // Additional skill fields for template compatibility
    technicalSkills: Joi.string().optional().max(500),
    softSkills: Joi.string().optional().max(500),
    languagesString: Joi.string().optional().max(200),
    certificationsString: Joi.string().optional().max(500),
    tools: Joi.string().optional().max(500),
    additionalInfo: Joi.array().items(Joi.string().max(500)).optional(),
  }).required(),
});
