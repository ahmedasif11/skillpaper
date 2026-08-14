# LLM Integration — Google Gemini

> Feature: Resume Upload & LLM Auto-fill
> Last updated: 2026-08-14

---

## 1. Overview

Google Gemini is the core intelligence layer of this feature. Its job is to read unstructured resume text and convert it into structured JSON that matches SkillPaper's `ResumeFormData` schema.

**Why Gemini?**
- Native structured output mode (returns valid JSON, no post-processing needed)
- Free tier supports prototyping at scale
- `gemini-3.5-flash` has low latency for resume-length text
- Same Flash model is retried as a fallback for empty/invalid JSON (Gemini 2.0 / 1.5 models were shut down)
- Easy migration path: swap to OpenAI or Claude by changing the service adapter

---

## 2. Model Selection Strategy

| Model | Use Case | Latency | Cost |
|---|---|---|---|
| `gemini-3.5-flash` | Default for all parses | ~3–8s | Low |
| `gemini-3.5-flash` | Retry if Flash produces empty/invalid JSON | ~3–8s | Low |

**Selection logic:**
```ts
const model = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';
```

---

## 3. Integration Library

```
npm install @google/generative-ai
```

**Backend service file:** `src/services/gemini.service.ts`

```ts
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function parseResumeWithGemini(rawText: string): Promise<ParsedResumeData> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESUME_JSON_SCHEMA,  // defined below
    },
  });

  const prompt = buildResumeParsePrompt(rawText);
  const result = await model.generateContent(prompt);
  const jsonText = result.response.text();
  return JSON.parse(jsonText) as ParsedResumeData;
}
```

---

## 4. JSON Schema (Gemini Structured Output)

Gemini's structured output requires providing a JSON schema. This schema must match SkillPaper's `ResumeFormData` interface.

```ts
// src/services/gemini.schema.ts

export const RESUME_JSON_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING, description: "Full name of the candidate" },
    email: { type: SchemaType.STRING, description: "Email address" },
    phone: { type: SchemaType.STRING, description: "Phone number with country code" },
    location: { type: SchemaType.STRING, description: "City, Country or full address" },
    summary: { type: SchemaType.STRING, description: "Professional summary or objective (2-4 sentences)" },
    links: {
      type: SchemaType.ARRAY,
      description: "Professional links: LinkedIn, GitHub, portfolio, etc.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          url: { type: SchemaType.STRING }
        },
        required: ['url']
      }
    },
    education: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          institution: { type: SchemaType.STRING },
          degree: { type: SchemaType.STRING, description: "e.g. Bachelor of Science, Master of Arts" },
          field: { type: SchemaType.STRING, description: "e.g. Computer Science, Business Administration" },
          graduationYear: { type: SchemaType.STRING, description: "Year or date range e.g. 2018-2022" },
          gpa: { type: SchemaType.STRING, description: "GPA if mentioned" },
          description: { type: SchemaType.STRING, description: "Relevant coursework, honors, activities" }
        },
        required: ['institution', 'degree']
      }
    },
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING, description: "Job title / position" },
          startDate: { type: SchemaType.STRING, description: "e.g. Jan 2022 or 2022-01" },
          endDate: { type: SchemaType.STRING, description: "e.g. Dec 2023, Present, or null if current" },
          location: { type: SchemaType.STRING, description: "Remote, city, or country" },
          responsibilities: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Each bullet point as a separate string. Use action verbs."
          },
          description: { type: SchemaType.STRING, description: "Summary of role if bullets aren't available" }
        },
        required: ['company', 'title']
      }
    },
    skills: {
      type: SchemaType.ARRAY,
      description: "Technical skills, tools, frameworks, languages",
      items: { type: SchemaType.STRING }
    },
    softSkills: {
      type: SchemaType.ARRAY,
      description: "Soft/interpersonal skills",
      items: { type: SchemaType.STRING }
    },
    tools: {
      type: SchemaType.ARRAY,
      description: "Software tools, platforms, IDEs",
      items: { type: SchemaType.STRING }
    },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          technologies: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          },
          url: { type: SchemaType.STRING, description: "GitHub URL, live demo, or null" },
          date: { type: SchemaType.STRING }
        },
        required: ['name', 'description']
      }
    },
    certifications: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          issuer: { type: SchemaType.STRING },
          date: { type: SchemaType.STRING },
          url: { type: SchemaType.STRING }
        },
        required: ['name']
      }
    },
    languages: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          proficiency: {
            type: SchemaType.STRING,
            enum: ['Native', 'Fluent', 'Professional', 'Conversational', 'Basic']
          }
        },
        required: ['name']
      }
    },
    achievements: {
      type: SchemaType.ARRAY,
      description: "Awards, honors, publications, accomplishments",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          date: { type: SchemaType.STRING }
        },
        required: ['title']
      }
    }
  },
  required: ['name']
};
```

---

## 5. Prompt Design

The prompt is the most critical piece. It must:
1. Tell Gemini what it's looking at
2. Instruct it on how to handle ambiguity
3. Specify output formatting expectations (even though we're using schema mode)
4. Handle edge cases (missing data, non-English content, etc.)

```ts
// src/services/gemini.prompts.ts

export function buildResumeParsePrompt(rawText: string): string {
  return `
You are an expert resume parser. Your job is to extract structured information from the resume text below and return it as a valid JSON object.

INSTRUCTIONS:
- Extract ALL information present in the resume. Do not infer or fabricate any data.
- If a field is not present in the resume, omit it from the JSON (do not set it to null or empty string unless it's a required field).
- For "experience.responsibilities", convert each bullet point or sentence into a separate array item. Start each item with an action verb (past tense for past roles, present for current).
- For "skills", only include technical skills (programming languages, frameworks, libraries, databases).
- For "softSkills", include interpersonal and non-technical skills.
- For "tools", include software tools, platforms, and IDEs.
- For date fields, preserve the original format from the resume (e.g., "Jan 2022", "2022-01", "January 2022").
- If a job is current (no end date), set endDate to "Present".
- For "summary", use the original text if available. Do not rewrite or improve it.
- For "links", identify LinkedIn, GitHub, portfolio sites, and other professional URLs.
- Language names should be in English (e.g., "Spanish" not "Español").
- If the resume is in a language other than English, translate field labels to English but preserve the actual content as-is.

RESUME TEXT:
---
${rawText.slice(0, 12000)}
---

Return ONLY the JSON object, no additional text or explanation.
`.trim();
}
```

**Token budget:**
- `rawText` is capped at 12,000 characters (~3,000 tokens) to stay within efficient Gemini Flash context
- For longer resumes, the text is split into sections and merged
- System instruction tokens: ~300
- Expected response tokens: ~1,000–2,000

---

## 6. Response Validation & Normalisation

Even with structured output, Gemini's response must be validated before storing.

**File:** `src/services/resumeParser.normalise.ts`

```ts
import { z } from 'zod';

const ParsedResumeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  links: z.array(z.object({
    label: z.string().optional(),
    url: z.string().url(),
  })).optional().default([]),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    graduationYear: z.string().optional(),
    gpa: z.string().optional(),
    description: z.string().optional(),
  })).optional().default([]),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    location: z.string().optional(),
    responsibilities: z.array(z.string()).optional().default([]),
    description: z.string().optional(),
  })).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  softSkills: z.array(z.string()).optional().default([]),
  tools: z.array(z.string()).optional().default([]),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()).optional().default([]),
    url: z.string().optional(),
    date: z.string().optional(),
  })).optional().default([]),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string().optional(),
    date: z.string().optional(),
    url: z.string().optional(),
  })).optional().default([]),
  languages: z.array(z.object({
    name: z.string(),
    proficiency: z.string().optional(),
  })).optional().default([]),
  achievements: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.string().optional(),
  })).optional().default([]),
});

export function validateAndNormalise(raw: unknown): ParsedResumeData {
  const result = ParsedResumeSchema.safeParse(raw);
  if (!result.success) {
    // Log validation errors but don't throw — return partial data
    console.warn('Gemini response had validation issues:', result.error.flatten());
    // Return what we can parse
    return ParsedResumeSchema.parse({ name: 'Unknown', ...raw });
  }
  return result.data;
}
```

---

## 7. Confidence Scoring

After parsing, compute a confidence score to inform the user about data quality:

```ts
export function computeConfidenceScore(data: ParsedResumeData): number {
  const checks = [
    !!data.name,
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
```

- Score ≥ 80%: Show as "Excellent — all key fields found"
- Score 50–79%: Show as "Good — some fields may be missing"
- Score < 50%: Show warning "Low confidence — please review carefully before applying"

---

## 8. Retry & Fallback Strategy

```
Gemini call attempt 1 (gemini-3.5-flash)
  ├─ Success → validate → store
  ├─ Rate limit (429) → wait 5s → retry (max 3×)
  ├─ Model overload (503) → retry with backoff
  └─ Empty/invalid response → retry once with gemini-3.5-flash
       ├─ Success → validate → store
       └─ Failure → set status: "failed:parse", store rawText only
```

When a parse fails, the user is still allowed to:
- Re-trigger parsing manually (retry button)
- Use manual form entry instead
- Download their original file

---

## 9. Long Resume Handling (Text Chunking)

If `rawText > 12,000 characters`:

```ts
export function chunkResumeText(text: string): string[] {
  const SECTION_HEADERS = /\n(EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|AWARDS)/gi;
  // Split by section headers
  const sections = text.split(SECTION_HEADERS);
  // Merge chunks to stay under 12k chars each
  return mergeChunksUnderLimit(sections, 12000);
}
```

For multi-chunk resumes:
1. Parse each chunk separately
2. Merge results (later experience/education items appended, not overwritten)
3. Personal info taken only from the first chunk

---

## 10. Cost Estimation

| Scenario | Input Tokens | Output Tokens | Cost (Flash) | Monthly at 1000 users/day |
|---|---|---|---|---|
| Typical resume (2 pages) | ~800 | ~600 | ~$0.000350 | ~$10.50 |
| Long resume (4 pages) | ~1,600 | ~900 | ~$0.000625 | ~$18.75 |
| Re-parse (no cache hit) | ~800 | ~600 | ~$0.000350 | varies |

**Cost control measures:**
- Cached parse data = zero LLM cost on reuse
- Hash-based change detection = skip re-parse for unchanged files
- Free tier (Gemini Flash): 15 RPM, 1M tokens/day free → sufficient for early growth
- Quota alerting: alert when monthly token usage exceeds 80% of budget

---

## 11. Privacy Considerations

- Resume text contains highly personal information (address, DOB, phone, salary history)
- Text is sent to Google's Gemini API: users must be informed via updated **Privacy Policy** and **Terms of Service**
- Text is NOT stored after the Gemini call completes (only the structured JSON output is persisted)
- Consider adding a "By uploading, you agree that resume content will be processed by Google Gemini AI" notice in the upload UI
- Option to add a toggle: "Process locally only" (future: local model via Ollama) for privacy-conscious users
