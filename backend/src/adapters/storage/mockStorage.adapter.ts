import type { IStorageService } from '../../interfaces/IStorageService';
import type { ResumeMime, StoredObject } from '../../interfaces/types';

export class MockStorageAdapter implements IStorageService {
  private readonly objects = new Map<string, Buffer>();
  readonly bucket = 'mock-skillpaper-resumes';

  async put(params: {
    key: string;
    body: Buffer;
    contentType: ResumeMime;
  }): Promise<StoredObject> {
    this.objects.set(params.key, Buffer.from(params.body));
    return {
      key: params.key,
      bucket: this.bucket,
      size: params.body.length,
    };
  }

  async get(key: string): Promise<Buffer> {
    const body = this.objects.get(key);
    if (!body) {
      throw new Error(`Object not found: ${key}`);
    }
    return Buffer.from(body);
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async presignGet(key: string, _expiresSeconds: number): Promise<string> {
    if (!this.objects.has(key)) {
      throw new Error(`Object not found: ${key}`);
    }
    return `mock://storage/${encodeURIComponent(key)}`;
  }

  has(key: string): boolean {
    return this.objects.has(key);
  }
}
