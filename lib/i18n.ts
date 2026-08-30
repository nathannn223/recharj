import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

const LANGUAGE_KEY = 'recharj.language';

export type SupportedLanguage = 'fr' | 'en';
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['fr', 'en'];

// French if the device is French, English for everyone else — the only two
// languages this app actually has content for, so anything unsupported
// (Spanish, German, ...) falls back to English rather than a language with
// no translations.
function detectDeviceLanguage(): SupportedLanguage {
  const code = Localization.getLocales()[0]?.languageCode;
  return code === 'fr' ? 'fr' : 'en';
}

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: detectDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes — double-escaping would show literal &amp; etc.
  returnEmptyString: false,
});

/**
 * Applies a manually chosen language, saved in app/(tabs)/profile.tsx.
 * `null` clears the override and goes back to following the device.
 */
export async function setLanguage(lang: SupportedLanguage | null): Promise<void> {
  if (lang === null) {
    await AsyncStorage.removeItem(LANGUAGE_KEY);
    await i18n.changeLanguage(detectDeviceLanguage());
  } else {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18n.changeLanguage(lang);
  }
}

/** `null` means "following the device", not "no preference set yet". */
export async function getLanguageOverride(): Promise<SupportedLanguage | null> {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  return stored === 'fr' || stored === 'en' ? stored : null;
}

/**
 * Applies any saved override on top of the device-detected language i18n
 * already booted with above. Awaited by app/_layout.tsx before the first
 * render, the same way font loading is, so there's no flash of the wrong
 * language on a cold start.
 */
export async function loadLanguageOverride(): Promise<void> {
  const override = await getLanguageOverride();
  if (override) await i18n.changeLanguage(override);
}

export default i18n;
