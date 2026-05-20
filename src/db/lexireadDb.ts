/**
 * Dexie database schema for LexiRead (IndexedDB).
 */
import Dexie, { type Table } from 'dexie';
import type {
  AnnotationRecord,
  DocumentRecord,
  NotificationLogRecord,
  SettingsRecord,
  VocabularyRecord,
} from './types';

export type {
  AnnotationInsert,
  AnnotationRecord,
  DefaultSortOrder,
  DocumentInsert,
  DocumentRecord,
  NotificationLogInsert,
  NotificationLogRecord,
  PageBackground,
  SelectionMetadata,
  SettingsRecord,
  ThemePreference,
  VocabularyInsert,
  VocabularyRecord,
} from './types';

export { DEFAULT_SETTINGS, SETTINGS_SINGLETON_ID } from './defaults';

export class LexiReadDatabase extends Dexie {
  documents!: Table<DocumentRecord, string>;
  vocabulary!: Table<VocabularyRecord, string>;
  annotations!: Table<AnnotationRecord, string>;
  settings!: Table<SettingsRecord, string>;
  notificationLog!: Table<NotificationLogRecord, string>;

  constructor() {
    super('LexiReadDB');
    this.version(1).stores({
      documents:
        'id, displayName, originalName, importDate, lastOpenedAt, size',
      vocabulary:
        'id, word, dateAdded, sourceDocumentId, nextReviewAt, [word+dateAdded]',
      annotations: 'id, documentId, pageNumber, createdAt',
      settings: 'id',
      notificationLog: 'id, vocabId, deliveredAt',
    });
  }
}

/** Singleton database instance. */
export const lexireadDb = new LexiReadDatabase();
