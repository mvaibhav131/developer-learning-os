import { DEFAULT_LOCALE, type Locale } from '@dlos/shared';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useUiStore } from '../../stores/ui-store';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { hiLatn } from './locales/hi-Latn';

export const resources = {
  en: { translation: en },
  'hi-Latn': { translation: hiLatn },
  hi: { translation: hi },
} as const;

/** Intl does not know Hinglish, so dates and numbers use Indian English formats for it. */
export const INTL_LOCALE: Record<Locale, string> = {
  'hi-Latn': 'en-IN',
  en: 'en-IN',
  hi: 'hi-IN',
};

export const initialLocale = (): Locale => useUiStore.getState().locale || DEFAULT_LOCALE;

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale(),
  fallbackLng: { 'hi-Latn': ['en'], hi: ['en'], default: ['en'] },
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
