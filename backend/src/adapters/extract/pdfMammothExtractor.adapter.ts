import type { ITextExtractor } from '../../interfaces/ITextExtractor';
import type { ExtractResult, ResumeMime } from '../../interfaces/types';

/** Placeholder until Phase 2 (pdf-parse + mammoth). */
export class PdfMammothExtractorAdapter implements ITextExtractor {
  async extract(_params: {
    buffer: Buffer;
    mimeType: ResumeMime;
  }): Promise<ExtractResult> {
    throw new Error(
      'Text extraction is not implemented until Phase 2 (pdf-parse / mammoth).'
    );
  }
}
