import type { DataStore } from './DataStore';
import type { SearchController } from './SearchController';
import type { DefaultSortOrder, DocumentRecord } from '../db';

export type DocumentSort = DefaultSortOrder;

/**
 * Handles PDF import, listing, sorting, renaming, and open tracking.
 */
export class FileManager {
  constructor(
    private readonly dataStore: DataStore,
    private readonly searchController: SearchController,
  ) {}

  /** Import a PDF from local device storage. */
  async importPdf(file: File): Promise<string> {
    await this.dataStore.init();
    const displayName = file.name.replace(/\.pdf$/i, '') || file.name;
    const record = await this.dataStore.putDocument({
      originalName: file.name,
      displayName,
      size: file.size,
      importDate: Date.now(),
      pdfBlob: file,
    });
    return record.id;
  }

  /** List documents with optional sort. */
  async listDocuments(sort: DocumentSort = 'newest'): Promise<DocumentRecord[]> {
    await this.dataStore.init();
    const documents = await this.dataStore.getAllDocuments();
    return this.searchController.sortDocuments(documents, sort);
  }

  /** Get a single document by id. */
  async getDocument(id: string): Promise<DocumentRecord | undefined> {
    await this.dataStore.init();
    return this.dataStore.getDocument(id);
  }

  /** Rename a document display name. */
  async renameDocument(id: string, displayName: string): Promise<void> {
    await this.dataStore.init();
    const trimmed = displayName.trim();
    if (!trimmed) {
      throw new Error('Display name cannot be empty');
    }
    await this.dataStore.updateDocument(id, { displayName: trimmed });
  }

  /** Record that a document was opened (powers Recents). */
  async recordOpen(documentId: string): Promise<void> {
    await this.dataStore.init();
    await this.dataStore.updateDocument(documentId, {
      lastOpenedAt: Date.now(),
    });
  }

  /** Recently opened documents, newest first. */
  async getRecents(limit = 10): Promise<DocumentRecord[]> {
    await this.dataStore.init();
    const documents = await this.dataStore.getAllDocuments();
    return documents
      .filter((doc) => doc.lastOpenedAt != null)
      .sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))
      .slice(0, limit);
  }

  /** Remove a document and linked annotations/vocabulary. */
  async deleteDocument(id: string): Promise<void> {
    await this.dataStore.init();
    await this.dataStore.deleteDocument(id);
  }
}
