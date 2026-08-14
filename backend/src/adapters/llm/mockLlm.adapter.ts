import type { ILlmService } from '../../interfaces/ILlmService';
import type { LlmParseInput, LlmParseOutput } from '../../interfaces/types';
import type { ParsedResumeData } from '../../types/parsedResume';

const FIXTURE: ParsedResumeData = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1 555 0100',
  location: 'Test City',
  summary: 'Mock parsed resume for tests and Phase 1.',
  skills: ['TypeScript', 'Node.js'],
  experience: [
    {
      company: 'Example Corp',
      title: 'Engineer',
      startDate: 'Jan 2023',
      endDate: 'Present',
      responsibilities: ['Built APIs'],
    },
  ],
  education: [
    {
      institution: 'Example University',
      degree: 'BSc',
      field: 'Computer Science',
    },
  ],
  projects: [],
};

export class MockLlmAdapter implements ILlmService {
  async parseResume(_input: LlmParseInput): Promise<LlmParseOutput> {
    return {
      data: FIXTURE,
      model: 'mock',
      rawResponseText: JSON.stringify(FIXTURE),
    };
  }
}
