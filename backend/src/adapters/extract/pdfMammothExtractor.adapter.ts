import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { ExtractError } from '../../interfaces/ExtractError';
import type { ITextExtractor } from '../../interfaces/ITextExtractor';
import type { ExtractResult, ResumeMime } from '../../interfaces/types';
import type { OcrPdfFn } from './tesseractPdfOcr';

export const MIN_EXTRACTED_TEXT_LENGTH = 100;

const ENCRYPT_DICT_RE = /\/Encrypt(?:[\s\[\/<]|$)/;
const PASSWORD_ERROR_RE = /password|encrypt/i;
const CORRUPT_PDF_ERROR_RE =
  /xref|formaterror|invalid ?pdf|missing startxref|bad object|stream must end|unexpected eof/i;

export type PdfParseFn = (buffer: Buffer) => Promise<{
  text?: string;
  numpages?: number;
}>;

export interface PdfMammothExtractorDeps {
  pdfParse?: PdfParseFn;
  ocrPdf?: OcrPdfFn;
}

function emptyResult(pageCount?: number): ExtractResult {
  return {
    text: '',
    pageCount,
    isLikelyScannedPdf: true,
    isOcrExtracted: false,
  };
}

export function pdfDeclaresEncryption(buffer: Buffer): boolean {
  const head = buffer.subarray(0, Math.min(buffer.length, 256 * 1024));
  return ENCRYPT_DICT_RE.test(head.toString('latin1'));
}

function errorText(err: unknown): string {
  if (err instanceof Error) {
    const extra = (err as Error & { details?: unknown }).details;
    const extraText = typeof extra === 'string' ? extra : '';
    return `${err.name} ${err.message} ${extraText}`.trim();
  }
  return String(err);
}

export function isPdfPasswordError(err: unknown): boolean {
  const msg = errorText(err);
  const name = err instanceof Error ? err.name : '';
  return name === 'PasswordException' || PASSWORD_ERROR_RE.test(msg);
}

export function isPdfCorruptError(err: unknown): boolean {
  const name = err instanceof Error ? err.name : '';
  if (name === 'FormatError' || name === 'InvalidPDFException') {
    return true;
  }
  return CORRUPT_PDF_ERROR_RE.test(errorText(err));
}

function throwEncrypted(): never {
  throw new ExtractError(
    'encrypted_pdf',
    'This PDF is password-protected. Remove the password and upload it again.'
  );
}

function throwUnreadable(): never {
  throw new ExtractError(
    'unreadable_pdf',
    'This PDF is unreadable or damaged. Upload a valid file or enter details manually.'
  );
}

export class PdfMammothExtractorAdapter implements ITextExtractor {
  constructor(private readonly deps: PdfMammothExtractorDeps = {}) {}

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
    const parse = this.deps.pdfParse ?? pdfParse;
    let parsed: { text?: string; numpages?: number } | undefined;
    try {
      parsed = await parse(buffer);
    } catch (err) {
      if (isPdfPasswordError(err) || pdfDeclaresEncryption(buffer)) {
        throwEncrypted();
      }
      if (isPdfCorruptError(err)) {
        console.warn(
          'PDF text extraction failed:',
          err instanceof Error ? err.message : String(err)
        );
        throwUnreadable();
      }
      console.warn(
        'PDF text extraction failed:',
        err instanceof Error ? err.message : String(err)
      );
    }

    const text = (parsed?.text ?? '').trim();
    const pageCount = parsed?.numpages;

    if (text.length >= MIN_EXTRACTED_TEXT_LENGTH) {
      return { text, pageCount, isLikelyScannedPdf: false, isOcrExtracted: false };
    }

    // Encrypted PDFs may yield little/no text; never send them through OCR.
    if (pdfDeclaresEncryption(buffer)) {
      throwEncrypted();
    }

    return this.ocrFallback(buffer, pageCount);
  }

  private async ocrFallback(
    buffer: Buffer,
    pageCount?: number
  ): Promise<ExtractResult> {
    const ocrPdf = this.deps.ocrPdf;
    if (!ocrPdf) {
      return emptyResult(pageCount);
    }
    try {
      const ocrText = (await ocrPdf(buffer)).trim();
      if (ocrText.length >= MIN_EXTRACTED_TEXT_LENGTH) {
        return {
          text: ocrText,
          pageCount,
          isLikelyScannedPdf: true,
          isOcrExtracted: true,
        };
      }
    } catch (err) {
      console.warn(
        'Tesseract OCR fallback failed:',
        err instanceof Error ? err.message : String(err)
      );
    }
    return emptyResult(pageCount);
  }

  private async extractDocx(buffer: Buffer): Promise<ExtractResult> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value ?? '').trim();
      if (!text || text.length < MIN_EXTRACTED_TEXT_LENGTH) {
        return { text: '', isLikelyScannedPdf: false, isOcrExtracted: false };
      }
      return { text, isLikelyScannedPdf: false, isOcrExtracted: false };
    } catch (err) {
      console.warn(
        'DOCX text extraction failed:',
        err instanceof Error ? err.message : String(err)
      );
      return { text: '', isLikelyScannedPdf: false, isOcrExtracted: false };
    }
  }
}
