import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { languageAPI } from '../services/api';
import { useStore } from '../store/useStore';

interface TranslationContextValue {
  t: (key: string) => string;
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

// Base German translations (fallback)
const BASE_TRANSLATIONS: Record<string, string> = {
  'common.loading': 'Lädt...',
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
  'common.send': 'Senden',
  'common.sending': 'Sendet...',
  'auth.login': 'Anmelden',
  'auth.register': 'Registrieren',
  'nav.dashboard': 'Dashboard',
  'nav.chat': 'Chat',
  'nav.profile': 'Profil',
  'nav.logout': 'Logout',
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  const user = useStore((state) => state.user);
  const [translations, setTranslations] = useState<Record<string, string>>(BASE_TRANSLATIONS);
  const [language, setLanguageState] = useState<string>('Deutsch');
  const [isLoading, setIsLoading] = useState(false);

  // Load translations when language changes
  useEffect(() => {
    const userLang = user?.profile?.preferredLanguage || 'Deutsch';
    if (userLang !== language) {
      loadTranslations(userLang);
    }
  }, [user?.profile?.preferredLanguage]);

  const loadTranslations = async (lang: string) => {
    // If Deutsch, use base translations
    if (lang.toLowerCase() === 'deutsch' || lang.toLowerCase() === 'german') {
      setTranslations(BASE_TRANSLATIONS);
      setLanguageState(lang);
      return;
    }

    try {
      setIsLoading(true);
      const data = await languageAPI.getTranslations(lang);
      setTranslations(data.translations);
      setLanguageState(data.language);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fall back to base translations
      setTranslations(BASE_TRANSLATIONS);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: string) => {
    await loadTranslations(lang);
  };

  const t = (key: string): string => {
    return translations[key] || BASE_TRANSLATIONS[key] || key;
  };

  return (
    <TranslationContext.Provider value={{ t, language, setLanguage, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}
