import type { ResumeMime, StoredObject } from './types';

export interface IStorageService {
  put(params: {
    key: string;
    body: Buffer;
    contentType: ResumeMime;
  }): Promise<StoredObject>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  presignGet(key: string, expiresSeconds: number): Promise<string>;
}
