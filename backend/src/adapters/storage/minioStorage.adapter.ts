import { Client } from 'minio';
import type { IStorageService } from '../../interfaces/IStorageService';
import type { ResumeMime, StoredObject } from '../../interfaces/types';

export interface MinioStorageConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export class MinioStorageAdapter implements IStorageService {
  private readonly client: Client;
  private readonly bucket: string;
  private bucketReady: Promise<void> | null = null;

  constructor(private readonly config: MinioStorageConfig) {
    this.client = new Client({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    this.bucket = config.bucket;
  }

  private async ensureBucket(): Promise<void> {
    if (!this.bucketReady) {
      this.bucketReady = (async () => {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
          await this.client.makeBucket(this.bucket);
        }
      })();
    }
    await this.bucketReady;
  }

  async put(params: {
    key: string;
    body: Buffer;
    contentType: ResumeMime;
  }): Promise<StoredObject> {
    await this.ensureBucket();
    await this.client.putObject(
      this.bucket,
      params.key,
      params.body,
      params.body.length,
      { 'Content-Type': params.contentType }
    );
    return {
      key: params.key,
      bucket: this.bucket,
      size: params.body.length,
    };
  }

  async get(key: string): Promise<Buffer> {
    await this.ensureBucket();
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.ensureBucket();
    await this.client.removeObject(this.bucket, key);
  }

  async presignGet(key: string, expiresSeconds: number): Promise<string> {
    await this.ensureBucket();
    return this.client.presignedGetObject(this.bucket, key, expiresSeconds);
  }
}
