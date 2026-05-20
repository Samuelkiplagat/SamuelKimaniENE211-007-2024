import type { DefaultSortOrder } from '../db';

type SortableDocument = {
  displayName?: string;
  originalName?: string;
  importDate?: number;
  size?: number;
};

function displayNameOf(item: SortableDocument): string {
  return (item.displayName ?? item.originalName ?? '').toLowerCase();
}

/**
 * Filters and sorts file lists and vocabulary entries in memory.
 */
export class SearchController {
  /** Filter documents by name query. */
  filterDocuments<T extends SortableDocument>(items: T[], query: string): T[] {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => displayNameOf(item).includes(q));
  }

  /** Filter vocabulary by word or definition. */
  filterVocabulary<T extends { word?: string; definition?: string }>(
    items: T[],
    query: string,
  ): T[] {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const word = (item.word ?? '').toLowerCase();
      const def = (item.definition ?? '').toLowerCase();
      return word.includes(q) || def.includes(q);
    });
  }

  /** Sort documents by criterion. */
  sortDocuments<T extends SortableDocument>(
    items: T[],
    sortKey: DefaultSortOrder | string,
  ): T[] {
    const sorted = [...items];
    switch (sortKey) {
      case 'name-asc':
        return sorted.sort((a, b) =>
          displayNameOf(a).localeCompare(displayNameOf(b)),
        );
      case 'name-desc':
        return sorted.sort((a, b) =>
          displayNameOf(b).localeCompare(displayNameOf(a)),
        );
      case 'oldest':
        return sorted.sort(
          (a, b) => (a.importDate ?? 0) - (b.importDate ?? 0),
        );
      case 'size-asc':
        return sorted.sort((a, b) => (a.size ?? 0) - (b.size ?? 0));
      case 'size-desc':
        return sorted.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
      case 'newest':
      default:
        return sorted.sort(
          (a, b) => (b.importDate ?? 0) - (a.importDate ?? 0),
        );
    }
  }
}
