import type { ResumeMime, ScanResult } from './types';

export interface IScannerService {
  scan(params: { buffer: Buffer; mimeType: ResumeMime }): Promise<ScanResult>;
}
