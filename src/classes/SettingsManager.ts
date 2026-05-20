import type { DataStore } from './DataStore';
import type { DefaultSortOrder, PageBackground, ThemePreference } from '../db';

export const NOTIFICATION_INTERVAL_OPTIONS = [1, 12, 24] as const;
export const READER_FONT_SIZE_OPTIONS = [14, 16, 18, 20, 22] as const;

export interface AppSettings {
  notificationEnabled: boolean;
  notificationIntervalHours: number;
  defaultSortOrder: DefaultSortOrder;
  theme: ThemePreference;
  readerFontSize: number;
  pageBackground: PageBackground;
}

type SettingsListener = (settings: AppSettings) => void;

/**
 * Loads, persists, and exposes user preferences.
 */
export class SettingsManager {
  private settings: AppSettings;
  private listeners = new Set<SettingsListener>();

  constructor(private readonly dataStore: DataStore) {
    this.settings = {
      notificationEnabled: false,
      notificationIntervalHours: 24,
      defaultSortOrder: 'newest',
      theme: 'light',
      readerFontSize: 16,
      pageBackground: 'day',
    };
  }

  subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    listener(this.getSettings());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = this.getSettings();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  /** Load settings from storage. */
  async load(): Promise<AppSettings> {
    await this.dataStore.init();
    const stored = await this.dataStore.getSettings();
    this.settings = this.normalize({
      notificationEnabled: stored.notificationEnabled,
      notificationIntervalHours: stored.notificationIntervalHours,
      defaultSortOrder: stored.defaultSortOrder,
      theme: stored.theme,
      readerFontSize: stored.readerFontSize,
      pageBackground: stored.pageBackground,
    });
    this.notify();
    return this.getSettings();
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /** Merge, validate, persist, and notify subscribers. */
  async update(partial: Partial<AppSettings>): Promise<AppSettings> {
    await this.dataStore.init();
    this.settings = this.normalize({ ...this.settings, ...partial });
    await this.dataStore.saveSettings({
      notificationEnabled: this.settings.notificationEnabled,
      notificationIntervalHours: this.settings.notificationIntervalHours,
      defaultSortOrder: this.settings.defaultSortOrder,
      theme: this.settings.theme,
      readerFontSize: this.settings.readerFontSize,
      pageBackground: this.settings.pageBackground,
    });
    this.notify();
    return this.getSettings();
  }

  private normalize(raw: AppSettings): AppSettings {
    const hours = (
      NOTIFICATION_INTERVAL_OPTIONS as readonly number[]
    ).includes(raw.notificationIntervalHours)
      ? raw.notificationIntervalHours
      : 24;

    const fontSize = (READER_FONT_SIZE_OPTIONS as readonly number[]).includes(
      raw.readerFontSize,
    )
      ? raw.readerFontSize
      : 16;

    return {
      notificationEnabled: Boolean(raw.notificationEnabled),
      notificationIntervalHours: hours,
      defaultSortOrder: raw.defaultSortOrder ?? 'newest',
      theme: raw.theme === 'dark' ? 'dark' : 'light',
      readerFontSize: fontSize,
      pageBackground: raw.pageBackground === 'night' ? 'night' : 'day',
    };
  }
}
