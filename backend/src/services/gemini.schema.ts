import { SchemaType, type Schema } from '@google/generative-ai';

export const RESUME_JSON_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING, description: 'Full name of the candidate' },
    email: { type: SchemaType.STRING, description: 'Email address' },
    phone: {
      type: SchemaType.STRING,
      description: 'Phone number with country code',
    },
    location: {
      type: SchemaType.STRING,
      description: 'City, Country or full address',
    },
    summary: {
      type: SchemaType.STRING,
      description: 'Professional summary or objective (2-4 sentences)',
    },
    links: {
      type: SchemaType.ARRAY,
      description: 'Professional links: LinkedIn, GitHub, portfolio, etc.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          url: { type: SchemaType.STRING },
        },
        required: ['url'],
      },
    },
    education: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          institution: { type: SchemaType.STRING },
          degree: {
            type: SchemaType.STRING,
            description: 'e.g. Bachelor of Science, Master of Arts',
          },
          field: {
            type: SchemaType.STRING,
            description: 'e.g. Computer Science, Business Administration',
          },
          graduationYear: {
            type: SchemaType.STRING,
            description: 'Year or date range e.g. 2018-2022',
          },
          gpa: { type: SchemaType.STRING, description: 'GPA if mentioned' },
          description: {
            type: SchemaType.STRING,
            description: 'Relevant coursework, honors, activities',
          },
        },
        required: ['institution', 'degree'],
      },
    },
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          title: {
            type: SchemaType.STRING,
            description: 'Job title / position',
          },
          startDate: {
            type: SchemaType.STRING,
            description: 'e.g. Jan 2022 or 2022-01',
          },
          endDate: {
            type: SchemaType.STRING,
            description: 'e.g. Dec 2023, Present, or null if current',
          },
          location: {
            type: SchemaType.STRING,
            description: 'Remote, city, or country',
          },
          responsibilities: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description:
              'Each bullet point as a separate string. Use action verbs.',
          },
          description: {
            type: SchemaType.STRING,
            description: 'Summary of role if bullets are not available',
          },
        },
        required: ['company', 'title'],
      },
    },
    skills: {
      type: SchemaType.ARRAY,
      description: 'Technical skills, tools, frameworks, languages',
      items: { type: SchemaType.STRING },
    },
    softSkills: {
      type: SchemaType.ARRAY,
      description: 'Soft/interpersonal skills',
      items: { type: SchemaType.STRING },
    },
    tools: {
      type: SchemaType.ARRAY,
      description: 'Software tools, platforms, IDEs',
      items: { type: SchemaType.STRING },
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
            items: { type: SchemaType.STRING },
          },
          url: {
            type: SchemaType.STRING,
            description: 'GitHub URL, live demo, or null',
          },
          date: { type: SchemaType.STRING },
        },
        required: ['name', 'description'],
      },
    },
    certifications: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          issuer: { type: SchemaType.STRING },
          date: { type: SchemaType.STRING },
          url: { type: SchemaType.STRING },
        },
        required: ['name'],
      },
    },
    languages: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          proficiency: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: [
              'Native',
              'Fluent',
              'Professional',
              'Conversational',
              'Basic',
            ],
          },
        },
        required: ['name'],
      },
    },
    achievements: {
      type: SchemaType.ARRAY,
      description: 'Awards, honors, publications, accomplishments',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          date: { type: SchemaType.STRING },
        },
        required: ['title'],
      },
    },
  },
  required: ['name'],
};
