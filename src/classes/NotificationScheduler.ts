import type { VocabularyRecord } from '../db';
import { isNotificationSupported } from '../lib/notificationPermission';
import type { DataStore } from './DataStore';
import type { SettingsManager } from './SettingsManager';

export interface ReviewWordPayload {
  vocabId: string;
  word: string;
  definition: string;
}

const MAX_REVIEW_INTERVAL_HOURS = 168;

/**
 * Spaced-repetition notification scheduling via Service Worker bridge.
 * V1: interval reminders while the app can run timers; SW displays notifications.
 */
export class NotificationScheduler {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private messageBound = false;

  constructor(
    private readonly dataStore: DataStore,
    private readonly settingsManager: SettingsManager,
  ) {}

  /** Wire SW message listener and sync schedule from settings. */
  async init(): Promise<void> {
    this.bindServiceWorkerMessages();
    await this.syncFromSettings();
  }

  private bindServiceWorkerMessages(): void {
    if (this.messageBound || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as { type?: string; vocabId?: string } | undefined;
      if (data?.type === 'LEXIREAD_INTERACT' && data.vocabId) {
        void this.handleInteraction(data.vocabId);
      }
    });
    this.messageBound = true;
  }

  /** Apply settings: start/stop interval and notify service worker. */
  async syncFromSettings(): Promise<void> {
    await this.dataStore.init();
    await this.settingsManager.load();
    const settings = this.settingsManager.getSettings();

    this.stopTimer();
    this.postSettingsToWorker();

    if (!settings.notificationEnabled) return;
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
      return;
    }

    const intervalMs = settings.notificationIntervalHours * 60 * 60 * 1000;
    this.timerId = setInterval(() => {
      void this.handleTick();
    }, intervalMs);
  }

  postSettingsToWorker(): void {
    if (!('serviceWorker' in navigator)) return;
    const settings = this.settingsManager.getSettings();
    void navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({
        type: 'LEXIREAD_SETTINGS',
        enabled: settings.notificationEnabled,
        intervalHours: settings.notificationIntervalHours,
      });
    });
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /** Pick a random word, preferring entries due for review. */
  async pickReviewWord(): Promise<ReviewWordPayload | null> {
    await this.dataStore.init();
    const entries = await this.dataStore.getAllVocabulary();
    if (entries.length === 0) return null;

    const now = Date.now();
    const due = entries.filter((e) => e.nextReviewAt <= now);
    const pool = due.length > 0 ? due : entries;
    const picked = pool[Math.floor(Math.random() * pool.length)]!;
    return {
      vocabId: picked.id,
      word: picked.word,
      definition: picked.definition,
    };
  }

  /** Interval tick: show notification and log delivery. */
  async handleTick(): Promise<void> {
    const settings = this.settingsManager.getSettings();
    if (!settings.notificationEnabled) return;
    if (Notification.permission !== 'granted') return;

    const payload = await this.pickReviewWord();
    if (!payload) return;

    await this.showNotification(payload);
    await this.dataStore.putNotificationLog({
      vocabId: payload.vocabId,
      deliveredAt: Date.now(),
      interacted: false,
    });
  }

  /** Manual test trigger (Settings UI). */
  async sendTestNotification(): Promise<string | null> {
    if (!isNotificationSupported()) {
      throw new Error('Notifications are not supported in this browser.');
    }
    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission is not granted.');
    }
    const payload = await this.pickReviewWord();
    if (!payload) {
      throw new Error('Save words to your library first.');
    }
    await this.showNotification(payload);
    await this.dataStore.putNotificationLog({
      vocabId: payload.vocabId,
      deliveredAt: Date.now(),
      interacted: false,
    });
    return payload.word;
  }

  private async showNotification(payload: ReviewWordPayload): Promise<void> {
    const body =
      payload.definition.length > 240
        ? `${payload.definition.slice(0, 237)}…`
        : payload.definition;

    const options: NotificationOptions = {
      body,
      icon: '/icon.svg',
      tag: `lexiread-${payload.vocabId}`,
      data: { vocabId: payload.vocabId },
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'LEXIREAD_SHOW',
            title: payload.word,
            body,
            vocabId: payload.vocabId,
          });
          return;
        }
        await registration.showNotification(payload.word, options);
        return;
      } catch {
        // fall through to Notification constructor
      }
    }

    new Notification(payload.word, options);
  }

  /**
   * Stub: spaced-repetition — double review interval when user taps a notification.
   */
  async handleInteraction(vocabId: string): Promise<void> {
    await this.dataStore.init();
    const entry = await this.dataStore.getVocabularyEntry(vocabId);
    if (!entry) return;

    const nextInterval = Math.min(
      entry.reviewIntervalHours * 2,
      MAX_REVIEW_INTERVAL_HOURS,
    );
    await this.dataStore.updateVocabulary(vocabId, {
      reviewIntervalHours: nextInterval,
      nextReviewAt: Date.now() + nextInterval * 60 * 60 * 1000,
    });

    const logs = await this.dataStore.getNotificationLogsByVocab(vocabId);
    const latest = logs.sort((a, b) => b.deliveredAt - a.deliveredAt)[0];
    if (latest) {
      await this.dataStore.updateNotificationLog(latest.id, {
        interacted: true,
      });
    }
  }

  /** @internal Prefer due entries when building review pool */
  filterDueEntries(entries: VocabularyRecord[]): VocabularyRecord[] {
    const now = Date.now();
    return entries.filter((e) => e.nextReviewAt <= now);
  }
}
