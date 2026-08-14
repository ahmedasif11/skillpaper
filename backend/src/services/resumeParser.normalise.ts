import { z } from 'zod';
import type { ParsedResumeData } from '../types/parsedResume';

const optionalUrl = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const parsed = z.string().url().safeParse(value);
    return parsed.success ? parsed.data : undefined;
  });

const ParsedResumeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')).transform((v) =>
    v ? v : undefined
  ),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  links: z
    .array(
      z.object({
        label: z.string().optional(),
        url: z.string().url(),
      })
    )
    .optional()
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string().optional(),
        graduationYear: z.string().optional(),
        gpa: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        location: z.string().optional(),
        responsibilities: z.array(z.string()).optional().default([]),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  skills: z.array(z.string()).optional().default([]),
  softSkills: z.array(z.string()).optional().default([]),
  tools: z.array(z.string()).optional().default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        technologies: z.array(z.string()).optional().default([]),
        url: optionalUrl,
        date: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional(),
        date: z.string().optional(),
        url: optionalUrl,
      })
    )
    .optional()
    .default([]),
  languages: z
    .array(
      z.object({
        name: z.string(),
        proficiency: z
          .enum([
            'Native',
            'Fluent',
            'Professional',
            'Conversational',
            'Basic',
          ])
          .optional(),
      })
    )
    .optional()
    .default([]),
  achievements: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

function asRecord(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function validateAndNormalise(raw: unknown): ParsedResumeData {
  const result = ParsedResumeSchema.safeParse(raw);
  if (result.success) {
    return result.data;
  }

  console.warn(
    'Gemini response had validation issues:',
    result.error.flatten()
  );

  const fallback = ParsedResumeSchema.safeParse({
    name: 'Unknown',
    ...asRecord(raw),
  });
  if (fallback.success) {
    return fallback.data;
  }

  return { name: 'Unknown' };
}

export function computeConfidenceScore(data: ParsedResumeData): number {
  const checks = [
    !!data.name && data.name !== 'Unknown',
    !!data.email,
    !!data.phone,
    !!data.summary,
    (data.experience?.length ?? 0) > 0,
    (data.education?.length ?? 0) > 0,
    (data.skills?.length ?? 0) > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
