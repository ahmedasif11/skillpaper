import { createCanvas } from '@napi-rs/canvas';
import { createWorker } from 'tesseract.js';

const OCR_MAX_PAGES = 5;
const OCR_MAX_WIDTH = 1600;
const OCR_SCALE = 2;

type PdfJsLib = {
  getDocument: (src: {
    data: Uint8Array;
    password?: string;
    isEvalSupported?: boolean;
    useSystemFonts?: boolean;
    verbosity?: number;
    canvasFactory?: NodeCanvasFactory;
  }) => { promise: Promise<PdfJsDocument> };
  VerbosityLevel?: { ERRORS: number };
};

type PdfJsDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
  destroy: () => Promise<void>;
};

type PdfJsPage = {
  getViewport: (params: { scale: number }) => {
    width: number;
    height: number;
  };
  render: (params: {
    canvasContext: unknown;
    viewport: { width: number; height: number };
    canvasFactory: NodeCanvasFactory;
  }) => { promise: Promise<void> };
};

class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
    return {
      canvas,
      context: canvas.getContext('2d'),
    };
  }

  reset(
    canvasAndContext: { canvas: { width: number; height: number } },
    width: number,
    height: number
  ) {
    canvasAndContext.canvas.width = Math.ceil(width);
    canvasAndContext.canvas.height = Math.ceil(height);
  }

  destroy(canvasAndContext: {
    canvas: { width: number; height: number } | null;
    context: unknown;
  }) {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
    }
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

function ensurePdfjsNodePolyfills(): void {
  const g = globalThis as typeof globalThis & Record<string, unknown>;
  if (g.DOMMatrix && g.Path2D) {
    return;
  }
  // pdfjs-dist looks for the `canvas` package; we already use @napi-rs/canvas.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const napiCanvas = require('@napi-rs/canvas') as {
    DOMMatrix: unknown;
    Path2D: unknown;
  };
  if (!g.DOMMatrix) {
    Object.assign(g, { DOMMatrix: napiCanvas.DOMMatrix });
  }
  if (!g.Path2D) {
    Object.assign(g, { Path2D: napiCanvas.Path2D });
  }
}

function loadPdfjs(): PdfJsLib {
  ensurePdfjsNodePolyfills();
  // CJS legacy build — pdfjs-dist v3 is AMD on the default entry.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('pdfjs-dist/legacy/build/pdf.js') as PdfJsLib;
}

async function renderPdfPagesToPng(buffer: Buffer): Promise<Buffer[]> {
  const pdfjs = loadPdfjs();
  const canvasFactory = new NodeCanvasFactory();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    password: '',
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: pdfjs.VerbosityLevel?.ERRORS ?? 0,
    canvasFactory,
  });
  const doc = await loadingTask.promise;
  const images: Buffer[] = [];
  try {
    const pageCount = Math.min(doc.numPages, OCR_MAX_PAGES);
    for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      const base = page.getViewport({ scale: 1 });
      const scale =
        base.width * OCR_SCALE > OCR_MAX_WIDTH
          ? OCR_MAX_WIDTH / base.width
          : OCR_SCALE;
      const viewport = page.getViewport({ scale });
      const canvasAndContext = canvasFactory.create(
        viewport.width,
        viewport.height
      );
      await page.render({
        canvasContext: canvasAndContext.context,
        viewport,
        canvasFactory,
      }).promise;
      const png = (
        canvasAndContext.canvas as unknown as {
          toBuffer: (type: string) => Buffer;
        }
      ).toBuffer('image/png');
      images.push(png);
      canvasFactory.destroy(canvasAndContext);
    }
  } finally {
    await doc.destroy();
  }
  return images;
}

export type OcrPdfFn = (buffer: Buffer) => Promise<string>;

export function createTesseractPdfOcr(): OcrPdfFn {
  return async (buffer: Buffer): Promise<string> => {
    const images = await renderPdfPagesToPng(buffer);
    if (images.length === 0) {
      return '';
    }

    const worker = await createWorker('eng', 1, { logger: () => undefined });
    try {
      const pages: string[] = [];
      for (const image of images) {
        const { data } = await worker.recognize(image);
        const text = (data.text ?? '').trim();
        if (text) {
          pages.push(text);
        }
      }
      return pages.join('\n\n').trim();
    } finally {
      await worker.terminate();
    }
  };
}
