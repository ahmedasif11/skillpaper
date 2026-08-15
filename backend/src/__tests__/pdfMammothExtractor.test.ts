import {
  MIN_EXTRACTED_TEXT_LENGTH,
  PdfMammothExtractorAdapter,
  pdfDeclaresEncryption,
} from '../adapters/extract/pdfMammothExtractor.adapter';
import { ExtractError } from '../interfaces/ExtractError';

const PDF_MIME = 'application/pdf' as const;
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' as const;

const LONG_TEXT = 'Jane Doe software engineer resume '.repeat(8); // > 100 chars

const ENCRYPTED_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Encrypt 2 0 R /Root 1 0 R >>\n%%EOF\n'
);

const PLAIN_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'
);

describe('pdfDeclaresEncryption', () => {
  it('detects an /Encrypt dictionary', () => {
    expect(pdfDeclaresEncryption(ENCRYPTED_PDF)).toBe(true);
    expect(pdfDeclaresEncryption(PLAIN_PDF)).toBe(false);
  });
});

describe('PdfMammothExtractorAdapter OCR fallback', () => {
  it('uses pdf-parse text when it is long enough and does not OCR', async () => {
    const ocrPdf = jest.fn(async () => 'should not run');
    const extractor = new PdfMammothExtractorAdapter({
      pdfParse: async () => ({ text: LONG_TEXT, numpages: 1 }),
      ocrPdf,
    });

    const result = await extractor.extract({
      buffer: PLAIN_PDF,
      mimeType: PDF_MIME,
    });

    expect(result.text).toBe(LONG_TEXT.trim());
    expect(result.isOcrExtracted).toBe(false);
    expect(result.isLikelyScannedPdf).toBe(false);
    expect(ocrPdf).not.toHaveBeenCalled();
  });

  it('falls back to Tesseract OCR for image-only PDFs and marks isOcrExtracted', async () => {
    const ocrPdf = jest.fn(async () => LONG_TEXT);
    const extractor = new PdfMammothExtractorAdapter({
      pdfParse: async () => ({ text: '   ', numpages: 2 }),
      ocrPdf,
    });

    const result = await extractor.extract({
      buffer: PLAIN_PDF,
      mimeType: PDF_MIME,
    });

    expect(ocrPdf).toHaveBeenCalledTimes(1);
    expect(result.text).toBe(LONG_TEXT.trim());
    expect(result.isOcrExtracted).toBe(true);
    expect(result.isLikelyScannedPdf).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.text.length).toBeGreaterThanOrEqual(MIN_EXTRACTED_TEXT_LENGTH);
  });

  it('does not OCR encrypted PDFs and throws encrypted_pdf', async () => {
    const ocrPdf = jest.fn(async () => LONG_TEXT);
    const extractor = new PdfMammothExtractorAdapter({
      pdfParse: async () => ({ text: '', numpages: 1 }),
      ocrPdf,
    });

    await expect(
      extractor.extract({ buffer: ENCRYPTED_PDF, mimeType: PDF_MIME })
    ).rejects.toMatchObject({
      name: 'ExtractError',
      code: 'encrypted_pdf',
    });
    expect(ocrPdf).not.toHaveBeenCalled();
  });

  it('does not OCR structurally corrupt PDFs and throws unreadable_pdf', async () => {
    const ocrPdf = jest.fn(async () => LONG_TEXT);
    const extractor = new PdfMammothExtractorAdapter({
      pdfParse: async () => {
        const err = new Error('bad XRef entry') as Error & { details: string };
        err.details = 'FormatError: bad XRef entry';
        throw err;
      },
      ocrPdf,
    });

    await expect(
      extractor.extract({ buffer: PLAIN_PDF, mimeType: PDF_MIME })
    ).rejects.toMatchObject({
      name: 'ExtractError',
      code: 'unreadable_pdf',
    });
    expect(ocrPdf).not.toHaveBeenCalled();
  });

  it('treats pdf-parse password errors as encrypted_pdf without OCR', async () => {
    const ocrPdf = jest.fn(async () => LONG_TEXT);
    const extractor = new PdfMammothExtractorAdapter({
      pdfParse: async () => {
        throw new Error('No password given');
      },
      ocrPdf,
    });

    await expect(
      extractor.extract({ buffer: PLAIN_PDF, mimeType: PDF_MIME })
    ).rejects.toBeInstanceOf(ExtractError);
    expect(ocrPdf).not.toHaveBeenCalled();
  });

  it('returns empty text when OCR also fails to yield enough content', async () => {
    const extractor = new PdfMammothExtractorAdapter({
      pdfParse: async () => ({ text: 'hi', numpages: 1 }),
      ocrPdf: async () => 'too short',
    });

    const result = await extractor.extract({
      buffer: PLAIN_PDF,
      mimeType: PDF_MIME,
    });

    expect(result.text).toBe('');
    expect(result.isOcrExtracted).toBe(false);
    expect(result.isLikelyScannedPdf).toBe(true);
  });

  it('does not OCR DOCX files', async () => {
    const ocrPdf = jest.fn(async () => LONG_TEXT);
    const extractor = new PdfMammothExtractorAdapter({ ocrPdf });
    const result = await extractor.extract({
      buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      mimeType: DOCX_MIME,
    });
    expect(ocrPdf).not.toHaveBeenCalled();
    expect(result.isOcrExtracted).toBe(false);
  });
});
