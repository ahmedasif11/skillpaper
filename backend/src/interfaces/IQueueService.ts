import type { ParseJobPayload } from './types';

export interface IQueueService {
  enqueueParse(payload: ParseJobPayload): Promise<{ jobId: string }>;
}
