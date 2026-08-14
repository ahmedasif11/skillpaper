import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import type { ITextExtractor } from '../../interfaces/ITextExtractor';
import type { ExtractResult, ResumeMime } from '../../interfaces/types';

const SCANNED_TEXT_THRESHOLD = 40;

function emptyResult(pageCount?: number): ExtractResult {
  return {
    text: '',
    pageCount,
    isLikelyScannedPdf: true,
  };
}

export class PdfMammothExtractorAdapter implements ITextExtractor {
  async extract(params: {
    buffer: Buffer;
    mimeType: ResumeMime;
  }): Promise<ExtractResult> {
    if (params.mimeType === 'application/pdf') {
      return this.extractPdf(params.buffer);
    }
    return this.extractDocx(params.buffer);
  }

  private async extractPdf(buffer: Buffer): Promise<ExtractResult> {
    try {
      const data = await pdfParse(buffer);
      const text = (data.text ?? '').trim();
      const pageCount = data.numpages;
      if (!text || text.length < SCANNED_TEXT_THRESHOLD) {
        return emptyResult(pageCount);
      }
      return { text, pageCount, isLikelyScannedPdf: false };
    } catch (err) {
      console.warn('PDF text extraction failed (encrypted or unreadable)', err);
      return emptyResult();
    }
  }

  private async extractDocx(buffer: Buffer): Promise<ExtractResult> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value ?? '').trim();
      if (!text || text.length < SCANNED_TEXT_THRESHOLD) {
        return { text: '', isLikelyScannedPdf: true };
      }
      return { text, isLikelyScannedPdf: false };
    } catch (err) {
      console.warn('DOCX text extraction failed', err);
      return { text: '', isLikelyScannedPdf: true };
    }
  }
}
