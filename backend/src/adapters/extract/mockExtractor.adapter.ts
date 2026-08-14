import type { ITextExtractor } from '../../interfaces/ITextExtractor';
import type { ExtractResult, ResumeMime } from '../../interfaces/types';

export class MockExtractorAdapter implements ITextExtractor {
  async extract(_params: {
    buffer: Buffer;
    mimeType: ResumeMime;
  }): Promise<ExtractResult> {
    return {
      text: 'Mock extracted resume text.',
      pageCount: 1,
      isLikelyScannedPdf: false,
    };
  }
}
