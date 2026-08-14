import type { ParsedResumeData } from './parsedResume';

export interface ParseResumeJobData {
  uploadedResumeId: string;
  userId: string;
  minioKey: string;
  mimeType: string;
  attempt: number;
}

export interface ParseResumeJobResult {
  success: boolean;
  parsedData?: ParsedResumeData;
  confidenceScore?: number;
  fileHash?: string;
  error?: string;
}
