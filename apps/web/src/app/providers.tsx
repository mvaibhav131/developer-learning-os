import { Toaster } from '@dlos/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '../lib/i18n';
import { queryClient, usePreferences } from '../lib/queries';
import { useUiStore } from '../stores/ui-store';

function AppearanceEffects() {
  const theme = useUiStore((state) => state.theme);
  const locale = useUiStore((state) => state.locale);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media.matches));
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    void i18n.changeLanguage(locale);
  }, [locale]);

  return null;
}

/** The database is the source of truth: adopt the saved language and theme once they load. */
function PreferencesSync() {
  const preferences = usePreferences();
  const setLocale = useUiStore((state) => state.setLocale);
  const setTheme = useUiStore((state) => state.setTheme);
  const serverLocale = preferences.data?.locale;
  const serverTheme = preferences.data?.theme;

  useEffect(() => {
    if (serverLocale) setLocale(serverLocale);
  }, [serverLocale, setLocale]);
  useEffect(() => {
    if (serverTheme) setTheme(serverTheme);
  }, [serverTheme, setTheme]);

  return null;
}

function ToasterHost() {
  const theme = useUiStore((state) => state.theme);
  return <Toaster theme={theme} position="bottom-right" closeButton />;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <AppearanceEffects />
          <PreferencesSync />
          {children}
          <ToasterHost />
        </MotionConfig>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
