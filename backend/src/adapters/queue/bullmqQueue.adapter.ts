import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import type { IQueueService } from '../../interfaces/IQueueService';
import type { ParseJobPayload } from '../../interfaces/types';

const QUEUE_NAME = 'resume-parse';

export interface BullmqQueueConfig {
  host: string;
  port: number;
}

export class BullmqQueueAdapter implements IQueueService {
  private readonly connection: ConnectionOptions;
  private readonly queue: Queue<ParseJobPayload>;
  private worker: Worker<ParseJobPayload> | null = null;

  constructor(config: BullmqQueueConfig) {
    this.connection = { host: config.host, port: config.port };
    this.queue = new Queue<ParseJobPayload>(QUEUE_NAME, {
      connection: this.connection,
    });
  }

  async enqueueParse(
    payload: ParseJobPayload
  ): Promise<{ jobId: string }> {
    const job = await this.queue.add('parse', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
    return { jobId: String(job.id ?? '') };
  }

  startWorker(
    handler: (payload: ParseJobPayload) => Promise<void>
  ): Worker<ParseJobPayload> {
    if (this.worker) {
      return this.worker;
    }
    this.worker = new Worker<ParseJobPayload>(
      QUEUE_NAME,
      async (job) => {
        await handler(job.data);
      },
      { connection: this.connection }
    );
    this.worker.on('failed', (job, err) => {
      console.error(
        'Parse job failed',
        job?.id,
        job?.data?.uploadedResumeId,
        err
      );
    });
    return this.worker;
  }
}
