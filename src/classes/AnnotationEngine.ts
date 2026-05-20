import type { AnnotationRecord, SelectionMetadata } from '../db';
import type { DataStore } from './DataStore';

export const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue'] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export const HIGHLIGHT_FILL: Record<HighlightColor, string> = {
  yellow: 'rgba(254, 240, 138, 0.55)',
  green: 'rgba(134, 239, 172, 0.55)',
  blue: 'rgba(147, 197, 253, 0.55)',
};

export interface PendingSelection {
  text: string;
  pageNumber: number;
  documentId: string;
  rects: NonNullable<SelectionMetadata['rects']>;
  menuPosition: { x: number; y: number };
}

export interface HighlightOverlay {
  id: string;
  rects: NonNullable<SelectionMetadata['rects']>;
  color: HighlightColor;
  fill: string;
  note?: string;
}

/**
 * Tracks highlights and notes on PDF text selections.
 *
 * TODO: Multi-page scroll mode would need per-page text layers and
 * selection scoped to the visible page stack; current build uses one
 * page + PDF.js TextLayer (pragmatic Vite setup).
 */
export class AnnotationEngine {
  private documentId: string | null = null;
  private pending: PendingSelection | null = null;
  private annotations: AnnotationRecord[] = [];

  constructor(private readonly dataStore: DataStore) {}

  setDocument(documentId: string): void {
    this.documentId = documentId;
    this.pending = null;
    this.annotations = [];
  }

  getPendingSelection(): PendingSelection | null {
    return this.pending;
  }

  clearPendingSelection(): void {
    this.pending = null;
  }

  /**
   * Capture browser selection inside the PDF text layer.
   */
  captureSelection(
    selection: Selection | null,
    layerRoot: HTMLElement | null,
    pageNumber: number,
  ): PendingSelection | null {
    if (!selection || selection.isCollapsed || !layerRoot || !this.documentId) {
      return null;
    }

    const anchor = selection.anchorNode;
    if (!anchor || !layerRoot.contains(anchor)) {
      return null;
    }

    const text = selection.toString().trim();
    if (!text) return null;

    const range = selection.getRangeAt(0);
    const layerRect = layerRoot.getBoundingClientRect();
    const rects = Array.from(range.getClientRects())
      .map((r) => ({
        x: r.left - layerRect.left + layerRoot.scrollLeft,
        y: r.top - layerRect.top + layerRoot.scrollTop,
        width: r.width,
        height: r.height,
      }))
      .filter((r) => r.width > 0 && r.height > 0);

    if (rects.length === 0) return null;

    const last = rects[rects.length - 1]!;
    const menuPosition = {
      x: last.x + last.width / 2,
      y: Math.max(0, last.y - 8),
    };

    this.pending = {
      text,
      pageNumber,
      documentId: this.documentId,
      rects,
      menuPosition,
    };
    return this.pending;
  }

  /** Apply a colour highlight to the current selection. */
  async addHighlight(color: HighlightColor): Promise<AnnotationRecord | null> {
    if (!this.pending) return null;
    return this.persistPending({ highlightColor: color });
  }

  /** Attach a note (creates a yellow highlight if none chosen yet). */
  async addNote(note: string, color: HighlightColor = 'yellow'): Promise<AnnotationRecord | null> {
    if (!this.pending) return null;
    const trimmed = note.trim();
    if (!trimmed) return null;
    return this.persistPending({ highlightColor: color, note: trimmed });
  }

  private async persistPending(extra: {
    highlightColor: string;
    note?: string;
  }): Promise<AnnotationRecord | null> {
    const pending = this.pending;
    if (!pending) return null;

    await this.dataStore.init();
    const record = await this.dataStore.putAnnotation({
      documentId: pending.documentId,
      pageNumber: pending.pageNumber,
      selectedText: pending.text,
      highlightColor: extra.highlightColor,
      note: extra.note,
      createdAt: Date.now(),
      selectionMeta: { rects: pending.rects },
    });

    this.annotations.push(record);
    this.pending = null;
    return record;
  }

  /** Load all annotations for the active document. */
  async loadAnnotations(documentId: string): Promise<AnnotationRecord[]> {
    await this.dataStore.init();
    this.annotations = await this.dataStore.getAnnotationsByDocument(documentId);
    return this.annotations;
  }

  /** Overlays to render on the current page. */
  getOverlaysForPage(pageNumber: number): HighlightOverlay[] {
    return this.annotations
      .filter((a) => a.pageNumber === pageNumber && a.selectionMeta?.rects?.length)
      .map((a) => {
        const color = this.normalizeColor(a.highlightColor);
        return {
          id: a.id,
          rects: a.selectionMeta!.rects!,
          color,
          fill: HIGHLIGHT_FILL[color],
          note: a.note,
        };
      });
  }

  private normalizeColor(value: string): HighlightColor {
    if (value === 'green' || value === 'blue') return value;
    return 'yellow';
  }
}
