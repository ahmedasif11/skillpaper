import type { ExtractResult, ResumeMime } from './types';

export interface ITextExtractor {
  extract(params: {
    buffer: Buffer;
    mimeType: ResumeMime;
  }): Promise<ExtractResult>;
}
