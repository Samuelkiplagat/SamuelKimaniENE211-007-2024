import { Bell, BookOpen, FolderOpen, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import {
  NOTIFICATION_INTERVAL_OPTIONS,
  READER_FONT_SIZE_OPTIONS,
} from '../classes/SettingsManager';
import type { DefaultSortOrder } from '../db';
import { useAppServices } from '../context/AppServicesContext';
import { useSettings } from '../context/SettingsContext';
import {
  isNotificationSupported,
  requestNotificationPermission,
} from '../lib/notificationPermission';

const SORT_OPTIONS: { value: DefaultSortOrder; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'size-asc', label: 'Smallest first' },
  { value: 'size-desc', label: 'Largest first' },
];

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { notificationScheduler } = useAppServices();
  const { settings, ready, updateSettings } = useSettings();
  const [notifHint, setNotifHint] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  if (!ready || !settings) {
    return (
      <p className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">
        Loading settings…
      </p>
    );
  }

  const persistNotifications = async (
    partial: Parameters<typeof updateSettings>[0],
  ) => {
    await updateSettings(partial);
    await notificationScheduler.syncFromSettings();
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotifHint(null);
    if (enabled) {
      if (!isNotificationSupported()) {
        setNotifHint('This browser does not support notifications.');
        return;
      }
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        setNotifHint(
          'Permission denied. Enable notifications in your browser settings to use reminders.',
        );
        await persistNotifications({ notificationEnabled: false });
        return;
      }
    }
    await persistNotifications({ notificationEnabled: enabled });
    if (enabled) {
      setNotifHint('Reminders enabled. Keep LexiRead open or installed as a PWA for best results.');
    }
  };

  const handleTestNotification = async () => {
    setNotifHint(null);
    setTesting(true);
    try {
      const word = await notificationScheduler.sendTestNotification();
      setNotifHint(word ? `Test notification sent: “${word}”.` : 'Test notification sent.');
    } catch (err) {
      setNotifHint(
        err instanceof Error ? err.message : 'Could not send test notification.',
      );
    } finally {
      setTesting(false);
    }
  };

  const permissionLabel = isNotificationSupported()
    ? Notification.permission
    : 'unsupported';

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Bell className="h-4 w-4" aria-hidden />
          Notifications
        </h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Vocabulary reminders from your saved library. Interval-based (V1).
        </p>

        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Browser permission: <span className="font-medium">{permissionLabel}</span>
        </p>

        <SettingRow label="Enable notifications">
          <input
            type="checkbox"
            checked={settings.notificationEnabled}
            onChange={(e) => void handleNotificationToggle(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            aria-label="Enable notifications"
          />
        </SettingRow>

        <SettingRow
          label="Reminder interval"
          description="How often to show vocabulary reminders"
        >
          <select
            value={settings.notificationIntervalHours}
            disabled={!settings.notificationEnabled}
            onChange={(e) =>
              void persistNotifications({
                notificationIntervalHours: Number(e.target.value),
              })
            }
            className="min-h-tap rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-50"
          >
            {NOTIFICATION_INTERVAL_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h === 1 ? 'Every hour' : h === 12 ? 'Twice daily' : 'Daily'}
              </option>
            ))}
          </select>
        </SettingRow>

        {settings.notificationEnabled && Notification.permission === 'granted' && (
          <button
            type="button"
            disabled={testing}
            onClick={() => void handleTestNotification()}
            className="mt-2 min-h-tap w-full rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-100 disabled:opacity-60 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-100"
          >
            {testing ? 'Sending…' : 'Send test notification'}
          </button>
        )}

        {notifHint && (
          <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            {notifHint}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <FolderOpen className="h-4 w-4" aria-hidden />
          Files
        </h2>

        <SettingRow label="Default sort order">
          <select
            value={settings.defaultSortOrder}
            onChange={(e) =>
              void updateSettings({
                defaultSortOrder: e.target.value as DefaultSortOrder,
              })
            }
            className="min-h-tap max-w-[10rem] rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </SettingRow>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Sun className="h-4 w-4" aria-hidden />
          Appearance
        </h2>

        <SettingRow label="App theme">
          <select
            value={settings.theme}
            onChange={(e) =>
              void updateSettings({
                theme: e.target.value as 'light' | 'dark',
              })
            }
            className="min-h-tap rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </SettingRow>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <BookOpen className="h-4 w-4" aria-hidden />
          Reader
        </h2>

        <SettingRow
          label="Page background"
          description="Day or night reading mode"
        >
          <select
            value={settings.pageBackground}
            onChange={(e) =>
              void updateSettings({
                pageBackground: e.target.value as 'day' | 'night',
              })
            }
            className="min-h-tap rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="day">Day</option>
            <option value="night">Night</option>
          </select>
        </SettingRow>

        <SettingRow label="Text size" description="Scales PDF page rendering">
          <select
            value={settings.readerFontSize}
            onChange={(e) =>
              void updateSettings({ readerFontSize: Number(e.target.value) })
            }
            className="min-h-tap rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {READER_FONT_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </SettingRow>

        <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
          <Moon className="h-4 w-4 shrink-0" aria-hidden />
          Reader preview uses {settings.pageBackground} mode at{' '}
          {settings.readerFontSize}px.
        </div>
      </section>
    </div>
  );
}
