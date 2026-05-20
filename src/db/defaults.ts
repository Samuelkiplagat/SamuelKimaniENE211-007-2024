import {
  SETTINGS_SINGLETON_ID,
  type DefaultSortOrder,
  type PageBackground,
  type SettingsRecord,
  type ThemePreference,
} from './types';

export { SETTINGS_SINGLETON_ID };

export const DEFAULT_SETTINGS: SettingsRecord = {
  id: SETTINGS_SINGLETON_ID,
  notificationEnabled: false,
  notificationIntervalHours: 24,
  defaultSortOrder: 'newest' satisfies DefaultSortOrder,
  theme: 'light' satisfies ThemePreference,
  readerFontSize: 16,
  pageBackground: 'day' satisfies PageBackground,
};
