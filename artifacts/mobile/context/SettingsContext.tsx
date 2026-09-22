/**
 * SettingsContext — Configurações gerais do app persistidas em AsyncStorage.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  autoCleanSchedule: 'off' | 'daily' | 'weekly' | 'monthly';
  trashRetentionDays: 7 | 15 | 30;
  notificationsEnabled: boolean;
  safeDelete: boolean;
  scanOnOpen: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoCleanSchedule: 'off',
  trashRetentionDays: 7,
  notificationsEnabled: true,
  safeDelete: false,
  scanOnOpen: true,
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
});

const SETTINGS_KEY = '@maxclean:settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        } catch {}
      }
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...patch };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    AsyncStorage.removeItem(SETTINGS_KEY);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
