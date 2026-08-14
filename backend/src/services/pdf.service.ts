// src/services/pdf.service.ts
import fs from 'fs';
import path from 'path';
import os from 'os';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';

// PDF generation limits and configuration
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEMPLATE_SIZE = 1024 * 1024; // 1MB
const PDF_TIMEOUT = 30000; // 30 seconds

export function getPdfOutputDir(): string {
  return path.join(os.tmpdir(), 'resume-maker');
}

/**
 * Resolve a stored PDF path only if it stays under the PDF output directory.
 */
export function resolveStoredPdfPath(storedPath: string): string | null {
  if (!storedPath) return null;
  const outDir = path.resolve(getPdfOutputDir());
  const resolved = path.resolve(storedPath);
  const relative = path.relative(outDir, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
}

/**
 * Return the on-disk PDF if it still exists under the output dir.
 * Otherwise regenerate from template HTML + stored resume data.
 */
export async function ensurePdfFile(
  storedPath: string | undefined,
  templateHtml: string,
  data: unknown
): Promise<{ filePath: string; regenerated: boolean }> {
  const existing = storedPath ? resolveStoredPdfPath(storedPath) : null;
  if (existing && fs.existsSync(existing)) {
    return { filePath: existing, regenerated: false };
  }

  const { filePath } = await generatePdfFromTemplate(templateHtml, data);
  return { filePath, regenerated: true };
}

/**
 * Render HTML with Handlebars and convert to PDF buffer using Puppeteer.
 * Returns: { buffer, filePath }
 */
export async function generatePdfFromTemplate(templateHtml: string, data: any) {
  if (!templateHtml || !data) {
    throw new Error('Template HTML and data are required');
  }

  // Validate template size
  if (templateHtml.length > MAX_TEMPLATE_SIZE) {
    throw new Error(
      `Template HTML too large. Maximum size: ${MAX_TEMPLATE_SIZE / 1024}KB`
    );
  }

  // Validate data size
  const dataSize = JSON.stringify(data).length;
  if (dataSize > MAX_TEMPLATE_SIZE) {
    throw new Error(
      `Resume data too large. Maximum size: ${MAX_TEMPLATE_SIZE / 1024}KB`
    );
  }

  // compile template
  const compiled = Handlebars.compile(templateHtml);
  const finalHtml = compiled(data || {});

  // Ensure output dir
  const outDir = getPdfOutputDir();
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  let browser;
  try {
    // Launch puppeteer with better options
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
      headless: true,
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering - match your template dimensions
    await page.setViewport({ width: 595, height: 842 }); // A4 dimensions in pixels

    // Set content with better wait conditions and timeout
    await page.setContent(finalHtml, {
      waitUntil: 'networkidle0',
      timeout: PDF_TIMEOUT,
    });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Wait a bit more for any remaining resources
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await page.emulateMediaType('screen');

    // create unique filename
    const fileName = `resume-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}.pdf`;
    const filePath = path.join(outDir, fileName);

    // Generate PDF with full width and no margins
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      preferCSSPageSize: true, // Use CSS page size for better page breaks
      displayHeaderFooter: false,
      scale: 1.0,
      // Enable page break handling
      tagged: true,
    });

    // Validate PDF size
    if (pdfBuffer.length > MAX_PDF_SIZE) {
      throw new Error(
        `Generated PDF too large. Size: ${(
          pdfBuffer.length /
          1024 /
          1024
        ).toFixed(2)}MB, Maximum: ${MAX_PDF_SIZE / 1024 / 1024}MB`
      );
    }

    // Write buffer to file
    fs.writeFileSync(filePath, pdfBuffer);

    return { buffer: pdfBuffer, filePath };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate PDF and return as base64 string for preview
 */
export async function generatePdfPreview(
  templateHtml: string,
  data: any
): Promise<string> {
  const { buffer } = await generatePdfFromTemplate(templateHtml, data);
  return buffer.toString('base64');
}

/**
 * Clean up old PDF files (older than 24 hours)
 */
export function cleanupOldPdfs(): void {
  try {
    const outDir = getPdfOutputDir();
    if (!fs.existsSync(outDir)) return;

    const files = fs.readdirSync(outDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    files.forEach((file) => {
      if (file.endsWith('.pdf')) {
        const filePath = path.join(outDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old PDF: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up old PDFs:', error);
  }
}

/**
 * Delete a specific PDF file
 */
export function deletePdfFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting PDF file:', error);
    return false;
  }
}
