import { getChatCompletion } from './openai.service';

// In-memory cache for translations
// Structure: { languageName: { key: translatedValue } }
const translationCache = new Map<string, Record<string, string>>();

// Base UI strings in German (source language)
const BASE_UI_STRINGS: Record<string, string> = {
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.chat': 'Chat',
  'nav.themenpakete': 'Themenpakete',
  'nav.profile': 'Profil',
  'nav.myArea': 'Mein Bereich',
  'nav.myCompany': 'Mein Unternehmen',
  'nav.logout': 'Logout',

  // Common
  'common.loading': 'Lädt...',
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
  'common.delete': 'Löschen',
  'common.edit': 'Bearbeiten',
  'common.send': 'Senden',
  'common.sending': 'Sendet...',
  'common.continue': 'Weiter',
  'common.back': 'Zurück',
  'common.close': 'Schließen',

  // Auth
  'auth.login': 'Anmelden',
  'auth.register': 'Registrieren',
  'auth.email': 'E-Mail',
  'auth.password': 'Passwort',
  'auth.confirmPassword': 'Passwort bestätigen',
  'auth.forgotPassword': 'Passwort vergessen?',
  'auth.noAccount': 'Noch kein Konto?',
  'auth.hasAccount': 'Bereits ein Konto?',
  'auth.language': 'Sprache',
  'auth.selectLanguage': 'Sprache wählen',
  'auth.customLanguage': 'Oder eigene Sprache eingeben',

  // Dashboard
  'dashboard.greeting.morning': 'Guten Morgen',
  'dashboard.greeting.day': 'Guten Tag',
  'dashboard.greeting.evening': 'Guten Abend',
  'dashboard.welcome': 'Willkommen zurück bei Leada Chat',
  'dashboard.period': 'Zeitraum',
  'dashboard.period.week': 'Letzte 7 Tage',
  'dashboard.period.month': 'Letzter Monat',
  'dashboard.period.3months': 'Letzte 3 Monate',
  'dashboard.period.6months': 'Letzte 6 Monate',
  'dashboard.period.all': 'Seit Beginn',
  'dashboard.activity': 'Ihre Aktivität',
  'dashboard.kiBriefing': 'KI-Briefing',
  'dashboard.newChat': 'Neuer Chat',
  'dashboard.newChat.desc': 'Starten Sie ein Gespräch mit Ihrem KI-Coach',
  'dashboard.themenpakete.title': 'Themenpakete',
  'dashboard.themenpakete.desc': 'Entdecken Sie neue Lernthemen',
  'dashboard.profile.title': 'Mein Profil',
  'dashboard.profile.desc': 'Reflexion & Entwicklung',
  'dashboard.activeThemenpakete': 'Aktive Themenpakete',
  'dashboard.stats': 'Statistik',
  'dashboard.stats.sessions': 'Chat-Sessions',
  'dashboard.stats.messages': 'Nachrichten',
  'dashboard.stats.themenpakete': 'Aktive Themenpakete',
  'dashboard.stats.routines': 'Routine-Durchführungen',
  'dashboard.viewAll': 'Alle anzeigen',
  'dashboard.noThemenpakete': 'Noch keine aktiven Themenpakete. Starten Sie eines aus der Bibliothek!',

  // Chat
  'chat.newChat': 'Neuer Chat',
  'chat.noChats': 'Noch keine Chats vorhanden',
  'chat.welcome': 'Willkommen bei Leada Chat',
  'chat.welcome.desc': 'Ihr KI-gestützter Coaching-Partner für Führungskräfte',
  'chat.startChat': 'Chat starten',
  'chat.yourMessage': 'Ihre Nachricht...',
  'chat.delete': 'Löschen',
  'chat.deleteConfirm': 'Möchten Sie diese Chat-Session wirklich löschen?',
  'chat.pinned': 'Fixiert',
  'chat.greeting': 'Wie kann ich Ihnen heute helfen?',
  'chat.greeting.withName': 'Hallo {name}! Wie kann ich Ihnen heute helfen?',

  // Profile
  'profile.title': 'Mein Profil',
  'profile.subtitle': 'Ihre persönliche Entwicklung im Überblick',
  'profile.currentSituation': 'Ihre aktuelle Situation',
  'profile.loadingSummary': 'Lädt Zusammenfassung...',
  'profile.noSummary': 'Noch keine Zusammenfassung verfügbar. Nutzen Sie Leada Chat aktiv, um Ihre persönliche Zusammenfassung zu generieren.',
  'profile.reflectionChat': 'Reflexions-Chat',
  'profile.reflectionChat.desc': 'Reflektieren Sie Ihre Entwicklung, Herausforderungen und Ziele',
  'profile.fullscreen': 'Vollbild öffnen',
  'profile.welcome': 'Willkommen in Ihrem Reflexions-Chat! Hier können Sie:',
  'profile.welcome.item1': 'Ihre persönliche Entwicklung reflektieren',
  'profile.welcome.item2': 'Herausforderungen besprechen',
  'profile.welcome.item3': 'Ziele identifizieren und planen',
  'profile.welcome.item4': 'Konkrete Entwicklungsvorschläge erhalten',

  // Themenpakete
  'themenpakete.title': 'Themenpakete',
  'themenpakete.day': 'Tag',
  'themenpakete.unit': 'Einheit',
  'themenpakete.start': 'Starten',
  'themenpakete.continue': 'Fortsetzen',
  'themenpakete.pause': 'Pausieren',
  'themenpakete.completed': 'Abgeschlossen',

  // Theme
  'theme.light': 'Hell',
  'theme.dark': 'Dunkel',
  'theme.system': 'System',

  // Errors
  'error.generic': 'Ein Fehler ist aufgetreten',
  'error.network': 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
  'error.auth': 'Authentifizierung fehlgeschlagen',
};

/**
 * Get available common languages
 */
export function getCommonLanguages(): Array<{ code: string; name: string; nativeName: string }> {
  return [
    { code: 'de', name: 'Deutsch', nativeName: 'Deutsch' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Español', nativeName: 'Español' },
    { code: 'fr', name: 'Français', nativeName: 'Français' },
    { code: 'it', name: 'Italiano', nativeName: 'Italiano' },
    { code: 'pt', name: 'Português', nativeName: 'Português' },
    { code: 'nl', name: 'Nederlands', nativeName: 'Nederlands' },
    { code: 'pl', name: 'Polski', nativeName: 'Polski' },
    { code: 'ru', name: 'Русский', nativeName: 'Русский' },
    { code: 'zh', name: '中文', nativeName: '中文' },
    { code: 'ja', name: '日本語', nativeName: '日本語' },
    { code: 'ar', name: 'العربية', nativeName: 'العربية' },
    { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe' },
  ];
}

/**
 * Translate UI strings to target language using OpenAI
 */
export async function translateUIStrings(targetLanguage: string): Promise<Record<string, string>> {
  // If target is German (source language), return base strings
  if (targetLanguage.toLowerCase() === 'deutsch' || targetLanguage.toLowerCase() === 'german') {
    return BASE_UI_STRINGS;
  }

  // Check cache first
  const cacheKey = targetLanguage.toLowerCase();
  if (translationCache.has(cacheKey)) {
    console.log(`✅ Translation cache HIT for: ${targetLanguage}`);
    return translationCache.get(cacheKey)!;
  }

  console.log(`🔄 Translating UI strings to: ${targetLanguage}`);

  try {
    // Prepare translation request
    const stringsToTranslate = JSON.stringify(BASE_UI_STRINGS, null, 2);

    const messages = [
      {
        role: 'system' as const,
        content: `You are a professional translator. Translate the provided UI strings from German to ${targetLanguage}.

IMPORTANT RULES:
1. Preserve all JSON keys exactly as they are (do not translate keys, only values)
2. Maintain the same JSON structure
3. Keep placeholders like {name} unchanged
4. Use natural, native expressions appropriate for the target language
5. Be consistent in formality level (use formal/polite tone for professional coaching context)
6. Return ONLY the JSON object, no explanations

If the target language is a dialect (e.g., "Schwäbisch", "Bayerisch"), translate accordingly while keeping it understandable.`,
      },
      {
        role: 'user' as const,
        content: `Translate these UI strings to ${targetLanguage}:\n\n${stringsToTranslate}`,
      },
    ];

    const response = await getChatCompletion(messages);

    // Parse the response
    let translatedStrings: Record<string, string>;

    try {
      // Try to extract JSON from response (handle cases where AI adds explanation)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        translatedStrings = JSON.parse(jsonMatch[0]);
      } else {
        translatedStrings = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('Failed to parse translation response:', parseError);
      console.error('Response was:', response);
      // Fallback to base strings
      return BASE_UI_STRINGS;
    }

    // Cache the translation
    translationCache.set(cacheKey, translatedStrings);
    console.log(`✅ Cached translation for: ${targetLanguage}`);

    return translatedStrings;
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback to base strings
    return BASE_UI_STRINGS;
  }
}

/**
 * Get a specific translated string
 */
export async function getTranslatedString(
  key: string,
  targetLanguage: string
): Promise<string> {
  const translations = await translateUIStrings(targetLanguage);
  return translations[key] || BASE_UI_STRINGS[key] || key;
}

/**
 * Clear translation cache (useful for development)
 */
export function clearTranslationCache(language?: string): void {
  if (language) {
    translationCache.delete(language.toLowerCase());
    console.log(`🗑️ Cleared translation cache for: ${language}`);
  } else {
    translationCache.clear();
    console.log('🗑️ Cleared all translation cache');
  }
}

/**
 * Get cache statistics
 */
export function getTranslationCacheStats(): {
  cachedLanguages: string[];
  cacheSize: number;
} {
  return {
    cachedLanguages: Array.from(translationCache.keys()),
    cacheSize: translationCache.size,
  };
}
