/**
 * LanguageContext — i18n para PT / EN / ES com persistência.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { strings, Language, StringKey } from '@/constants/strings';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: StringKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'pt',
  setLanguage: () => {},
  t: (key) => key,
});

const LANG_KEY = '@maxclean:language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((val) => {
      if (val === 'pt' || val === 'en' || val === 'es') {
        setLanguageState(val);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_KEY, lang);
  }, []);

  const t = useCallback(
    (key: StringKey): string => {
      return (strings[language] as Record<string, string>)[key] ?? key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
