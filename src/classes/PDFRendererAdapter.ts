import type { PDFDocumentProxy, PageViewport } from 'pdfjs-dist';
import { getDocument, TextLayer } from '../lib/pdfjs';
import type { DataStore } from './DataStore';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export interface PageDimensions {
  width: number;
  height: number;
}

/**
 * Adapts PDF.js for in-browser page rendering, zoom, and navigation.
 */
export class PDFRendererAdapter {
  private pdfDoc: PDFDocumentProxy | null = null;
  private currentPage = 1;
  private zoomFactor = 1;
  private readerFontSize = 16;
  private renderGeneration = 0;
  private activeTextLayer: TextLayer | null = null;

  constructor(private readonly dataStore: DataStore) {}

  /** Load a PDF by document id from IndexedDB storage. */
  async loadDocument(documentId: string): Promise<void> {
    await this.destroy();
    await this.dataStore.init();

    const record = await this.dataStore.getDocument(documentId);
    if (!record?.pdfBlob) {
      throw new Error('Document not found');
    }

    const data = await record.pdfBlob.arrayBuffer();
    const task = getDocument({ data });
    this.pdfDoc = await task.promise;
    this.currentPage = 1;
    this.zoomFactor = 1;
  }

  /** Reader text scale from settings (16px = 1×). */
  setReaderFontSize(px: number): void {
    this.readerFontSize = Math.min(24, Math.max(12, px));
  }

  private fontScale(): number {
    return this.readerFontSize / 16;
  }

  private async getViewport(containerWidth: number): Promise<PageViewport | null> {
    if (!this.pdfDoc) return null;
    const page = await this.pdfDoc.getPage(this.currentPage);
    const base = page.getViewport({ scale: 1 });
    const fitScale =
      containerWidth > 0 ? containerWidth / base.width : 1;
    return page.getViewport({
      scale: fitScale * this.zoomFactor * this.fontScale(),
    });
  }

  /** Render the current page to a canvas (fit to container width × zoom). */
  async renderPage(
    canvas: HTMLCanvasElement,
    containerWidth: number,
  ): Promise<PageDimensions | null> {
    if (!this.pdfDoc) return null;

    const generation = ++this.renderGeneration;
    const page = await this.pdfDoc.getPage(this.currentPage);
    if (generation !== this.renderGeneration) return null;

    const viewport = await this.getViewport(containerWidth);
    if (!viewport || generation !== this.renderGeneration) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

    try {
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    } catch (err) {
      if (generation !== this.renderGeneration) return null;
      throw err;
    }

    return { width: viewport.width, height: viewport.height };
  }

  /**
   * Render selectable text layer aligned to the canvas (same viewport).
   * TODO: Scroll-mode would render one text layer per visible page.
   */
  async renderTextLayer(
    container: HTMLDivElement,
    containerWidth: number,
  ): Promise<PageDimensions | null> {
    this.activeTextLayer?.cancel();
    this.activeTextLayer = null;

    if (!this.pdfDoc) return null;

    const generation = this.renderGeneration;
    const page = await this.pdfDoc.getPage(this.currentPage);
    const viewport = await this.getViewport(containerWidth);
    if (!viewport || generation !== this.renderGeneration) return null;

    const textContent = await page.getTextContent();
    container.replaceChildren();
    container.className = 'textLayer';
    container.style.width = `${viewport.width}px`;
    container.style.height = `${viewport.height}px`;

    const textLayer = new TextLayer({
      textContentSource: textContent,
      container,
      viewport,
    });
    this.activeTextLayer = textLayer;
    await textLayer.render();

    return { width: viewport.width, height: viewport.height };
  }

  /** Go to next page if available. Returns whether page changed. */
  nextPage(): boolean {
    const total = this.getPageCount();
    if (this.currentPage >= total) return false;
    this.currentPage += 1;
    return true;
  }

  /** Go to previous page if available. Returns whether page changed. */
  prevPage(): boolean {
    if (this.currentPage <= 1) return false;
    this.currentPage -= 1;
    return true;
  }

  /** Set zoom multiplier (1 = fit width). Clamped 0.5–3. */
  setZoom(scale: number): void {
    this.zoomFactor = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
  }

  getZoom(): number {
    return this.zoomFactor;
  }

  zoomIn(): void {
    this.setZoom(this.zoomFactor + ZOOM_STEP);
  }

  zoomOut(): void {
    this.setZoom(this.zoomFactor - ZOOM_STEP);
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getPageCount(): number {
    return this.pdfDoc?.numPages ?? 0;
  }

  async destroy(): Promise<void> {
    this.renderGeneration += 1;
    this.activeTextLayer?.cancel();
    this.activeTextLayer = null;
    if (this.pdfDoc) {
      await this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
    this.currentPage = 1;
    this.zoomFactor = 1;
  }
}
