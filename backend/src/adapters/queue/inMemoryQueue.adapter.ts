import { randomUUID } from 'crypto';
import type { IQueueService } from '../../interfaces/IQueueService';
import type { ParseJobPayload } from '../../interfaces/types';

export class InMemoryQueueAdapter implements IQueueService {
  constructor(
    private readonly handler: (payload: ParseJobPayload) => Promise<void>
  ) {}

  async enqueueParse(
    payload: ParseJobPayload
  ): Promise<{ jobId: string }> {
    await this.handler(payload);
    return { jobId: randomUUID() };
  }
}
