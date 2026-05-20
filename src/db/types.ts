/** Bounding boxes or offsets for a PDF text highlight overlay. */
export interface SelectionMetadata {
  rects?: Array<{ x: number; y: number; width: number; height: number }>;
  startOffset?: number;
  endOffset?: number;
}

export type ThemePreference = 'light' | 'dark';
export type PageBackground = 'day' | 'night';
export type DefaultSortOrder =
  | 'newest'
  | 'oldest'
  | 'name-asc'
  | 'name-desc'
  | 'size-asc'
  | 'size-desc';

export interface DocumentRecord {
  id: string;
  originalName: string;
  displayName: string;
  size: number;
  importDate: number;
  lastOpenedAt?: number;
  pdfBlob: Blob;
}

export interface VocabularyRecord {
  id: string;
  word: string;
  definition: string;
  phonetic?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  contextSentence?: string;
  sourceDocumentId: string;
  sourceDocumentName: string;
  dateAdded: number;
  reviewIntervalHours: number;
  nextReviewAt: number;
}

export interface AnnotationRecord {
  id: string;
  documentId: string;
  pageNumber: number;
  selectedText: string;
  highlightColor: string;
  note?: string;
  createdAt: number;
  selectionMeta?: SelectionMetadata;
}

export const SETTINGS_SINGLETON_ID = 'app' as const;

export interface SettingsRecord {
  id: typeof SETTINGS_SINGLETON_ID;
  notificationEnabled: boolean;
  notificationIntervalHours: number;
  defaultSortOrder: DefaultSortOrder;
  theme: ThemePreference;
  readerFontSize: number;
  pageBackground: PageBackground;
}

export interface NotificationLogRecord {
  id: string;
  vocabId: string;
  deliveredAt: number;
  interacted: boolean;
}

export type DocumentInsert = Omit<DocumentRecord, 'id'> & { id?: string };
export type VocabularyInsert = Omit<VocabularyRecord, 'id'> & { id?: string };
export type AnnotationInsert = Omit<AnnotationRecord, 'id'> & { id?: string };
export type NotificationLogInsert = Omit<NotificationLogRecord, 'id'> & {
  id?: string;
};
