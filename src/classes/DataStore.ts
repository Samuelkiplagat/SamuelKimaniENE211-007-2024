import type { LexiReadDatabase } from '../db/lexireadDb';
import {
  DEFAULT_SETTINGS,
  SETTINGS_SINGLETON_ID,
  type AnnotationInsert,
  type AnnotationRecord,
  type DocumentInsert,
  type DocumentRecord,
  type NotificationLogInsert,
  type NotificationLogRecord,
  type SettingsRecord,
  type VocabularyInsert,
  type VocabularyRecord,
} from '../db';

/**
 * Single point of access to IndexedDB via Dexie.
 * Storage implementation is hidden from all other classes.
 */
export class DataStore {
  private ready: Promise<void> | null = null;

  constructor(private readonly db: LexiReadDatabase) {}

  private newId(): string {
    return crypto.randomUUID();
  }

  /** Opens the database and ensures default settings exist. */
  async init(): Promise<void> {
    if (!this.ready) {
      this.ready = this.doInit();
    }
    await this.ready;
  }

  private async doInit(): Promise<void> {
    await this.db.open();
    const existing = await this.db.settings.get(SETTINGS_SINGLETON_ID);
    if (!existing) {
      await this.db.settings.put(DEFAULT_SETTINGS);
    }
  }

  // —— Documents ——

  async putDocument(data: DocumentInsert): Promise<DocumentRecord> {
    const record: DocumentRecord = { id: data.id ?? this.newId(), ...data };
    await this.db.documents.put(record);
    return record;
  }

  async getDocument(id: string): Promise<DocumentRecord | undefined> {
    return this.db.documents.get(id);
  }

  async getAllDocuments(): Promise<DocumentRecord[]> {
    return this.db.documents.orderBy('importDate').reverse().toArray();
  }

  async updateDocument(
    id: string,
    changes: Partial<Omit<DocumentRecord, 'id'>>,
  ): Promise<void> {
    await this.db.documents.update(id, changes);
  }

  async deleteDocument(id: string): Promise<void> {
    await this.db.transaction(
      'rw',
      this.db.documents,
      this.db.annotations,
      this.db.vocabulary,
      async () => {
        await this.db.annotations.where('documentId').equals(id).delete();
        await this.db.vocabulary
          .where('sourceDocumentId')
          .equals(id)
          .delete();
        await this.db.documents.delete(id);
      },
    );
  }

  // —— Vocabulary ——

  async putVocabulary(data: VocabularyInsert): Promise<VocabularyRecord> {
    const record: VocabularyRecord = { id: data.id ?? this.newId(), ...data };
    await this.db.vocabulary.put(record);
    return record;
  }

  async getVocabularyEntry(
    id: string,
  ): Promise<VocabularyRecord | undefined> {
    return this.db.vocabulary.get(id);
  }

  async getAllVocabulary(): Promise<VocabularyRecord[]> {
    return this.db.vocabulary.orderBy('dateAdded').reverse().toArray();
  }

  async getVocabularyByDocument(
    sourceDocumentId: string,
  ): Promise<VocabularyRecord[]> {
    return this.db.vocabulary
      .where('sourceDocumentId')
      .equals(sourceDocumentId)
      .toArray();
  }

  async updateVocabulary(
    id: string,
    changes: Partial<Omit<VocabularyRecord, 'id'>>,
  ): Promise<void> {
    await this.db.vocabulary.update(id, changes);
  }

  async deleteVocabulary(id: string): Promise<void> {
    await this.db.transaction(
      'rw',
      this.db.vocabulary,
      this.db.notificationLog,
      async () => {
        await this.db.notificationLog.where('vocabId').equals(id).delete();
        await this.db.vocabulary.delete(id);
      },
    );
  }

  // —— Annotations ——

  async putAnnotation(data: AnnotationInsert): Promise<AnnotationRecord> {
    const record: AnnotationRecord = { id: data.id ?? this.newId(), ...data };
    await this.db.annotations.put(record);
    return record;
  }

  async getAnnotation(id: string): Promise<AnnotationRecord | undefined> {
    return this.db.annotations.get(id);
  }

  async getAnnotationsByDocument(
    documentId: string,
  ): Promise<AnnotationRecord[]> {
    return this.db.annotations
      .where('documentId')
      .equals(documentId)
      .sortBy('createdAt');
  }

  async updateAnnotation(
    id: string,
    changes: Partial<Omit<AnnotationRecord, 'id'>>,
  ): Promise<void> {
    await this.db.annotations.update(id, changes);
  }

  async deleteAnnotation(id: string): Promise<void> {
    await this.db.annotations.delete(id);
  }

  async deleteAnnotationsByDocument(documentId: string): Promise<void> {
    await this.db.annotations.where('documentId').equals(documentId).delete();
  }

  // —— Settings (singleton) ——

  async getSettings(): Promise<SettingsRecord> {
    const record = await this.db.settings.get(SETTINGS_SINGLETON_ID);
    return record ?? DEFAULT_SETTINGS;
  }

  async saveSettings(
    settings: Partial<Omit<SettingsRecord, 'id'>>,
  ): Promise<SettingsRecord> {
    const current = await this.getSettings();
    const merged: SettingsRecord = {
      ...current,
      ...settings,
      id: SETTINGS_SINGLETON_ID,
    };
    await this.db.settings.put(merged);
    return merged;
  }

  // —— Notification log ——

  async putNotificationLog(
    data: NotificationLogInsert,
  ): Promise<NotificationLogRecord> {
    const record: NotificationLogRecord = {
      id: data.id ?? this.newId(),
      ...data,
    };
    await this.db.notificationLog.put(record);
    return record;
  }

  async getNotificationLog(
    id: string,
  ): Promise<NotificationLogRecord | undefined> {
    return this.db.notificationLog.get(id);
  }

  async getAllNotificationLogs(): Promise<NotificationLogRecord[]> {
    return this.db.notificationLog.orderBy('deliveredAt').reverse().toArray();
  }

  async getNotificationLogsByVocab(
    vocabId: string,
  ): Promise<NotificationLogRecord[]> {
    return this.db.notificationLog.where('vocabId').equals(vocabId).toArray();
  }

  async updateNotificationLog(
    id: string,
    changes: Partial<Omit<NotificationLogRecord, 'id'>>,
  ): Promise<void> {
    await this.db.notificationLog.update(id, changes);
  }

  async deleteNotificationLog(id: string): Promise<void> {
    await this.db.notificationLog.delete(id);
  }
}
