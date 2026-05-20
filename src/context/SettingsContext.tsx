import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AppSettings } from '../classes/SettingsManager';
import { applyTheme } from '../utils/theme';
import { useAppServices } from './AppServicesContext';

interface SettingsContextValue {
  settings: AppSettings | null;
  ready: boolean;
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settingsManager } = useAppServices();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void settingsManager.load().then((loaded) => {
      if (!cancelled) {
        setSettings(loaded);
        applyTheme(loaded.theme);
        setReady(true);
      }
    });

    const unsubscribe = settingsManager.subscribe((next) => {
      if (!cancelled) {
        setSettings(next);
        applyTheme(next.theme);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [settingsManager]);

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const next = await settingsManager.update(partial);
      setSettings(next);
      applyTheme(next.theme);
      return next;
    },
    [settingsManager],
  );

  return (
    <SettingsContext.Provider value={{ settings, ready, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
