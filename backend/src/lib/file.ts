import pdfParse from 'pdf-parse';

function isLikelyPdf(buffer: Buffer) {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString('utf8') === '%PDF';
}

function extractPlainText(buffer: Buffer) {
  return buffer.toString('utf8').replace(/\u0000/g, '').trim();
}

async function extractPdfTextWithPdfJs(buffer: Buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), useWorkerFetch: false });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  return pages.join('\n\n').trim();
}

const imageMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/bmp',
  'image/tiff',
]);

async function extractImageTextWithOcr(buffer: Buffer) {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const result = await worker.recognize(buffer);
    await worker.terminate();
    return (result.data.text ?? '').replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.warn(`OCR failed: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
}

export async function extractFileContent(file?: Express.Multer.File | null) {
  if (!file) {
    return undefined;
  }

  if (file.mimetype === 'text/plain') {
    return extractPlainText(file.buffer) || undefined;
  }

  const isPdfMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf';
  if (isPdfMime) {
    if (!isLikelyPdf(file.buffer)) {
      const fallbackText = extractPlainText(file.buffer);
      return fallbackText || undefined;
    }

    let primaryText = '';

    try {
      const parsed = await pdfParse(file.buffer);
      primaryText = parsed.text?.replace(/\s+/g, ' ').trim() ?? '';
    } catch (error) {
      console.warn(`PDF parse failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (primaryText.length >= 80) {
      return primaryText;
    }

    const fallbackText = await extractPdfTextWithPdfJs(file.buffer).catch((error) => {
      console.warn(`PDF.js parse failed: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    });
    return fallbackText.replace(/\s+/g, ' ').trim() || primaryText || undefined;
  }

  if (imageMimeTypes.has(file.mimetype)) {
    const ocrText = await extractImageTextWithOcr(file.buffer);
    return ocrText || undefined;
  }

  return undefined;
}