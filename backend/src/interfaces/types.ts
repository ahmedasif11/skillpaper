export type ResumeMime =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface StoredObject {
  key: string;
  bucket: string;
  size: number;
}

export interface ScanFinding {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ScanResult {
  safe: boolean;
  engine: 'clamav' | 'opencv' | 'composite' | 'mock';
  score?: number;
  findings: ScanFinding[];
}

export interface ExtractResult {
  text: string;
  pageCount?: number;
  isLikelyScannedPdf: boolean;
  isOcrExtracted: boolean;
}

export interface ParseJobPayload {
  uploadedResumeId: string;
  userId: string;
  objectKey: string;
}

export interface LlmParseInput {
  rawText: string;
  preferHigherQuality?: boolean;
}

export interface LlmParseOutput {
  data: unknown;
  model: string;
  rawResponseText?: string;
}
