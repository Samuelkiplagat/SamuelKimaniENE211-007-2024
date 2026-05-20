/**
 * PDF.js worker setup for Vite (must import before getDocument).
 */
import { GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export { getDocument, TextLayer } from 'pdfjs-dist';
export type { PDFDocumentProxy, PageViewport } from 'pdfjs-dist';
