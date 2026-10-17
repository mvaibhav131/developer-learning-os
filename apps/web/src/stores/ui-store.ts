import { DEFAULT_LOCALE, type Locale, type Theme } from '@dlos/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  theme: Theme;
  locale: Locale;
  sidebarCollapsed: boolean;
  /** Logs study time automatically while a lesson or problem is open. */
  autoTrackStudy: boolean;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setAutoTrackStudy: (enabled: boolean) => void;
  toggleSidebar: () => void;
}

/** Persisted under "dlos-ui"; public/theme-init.js reads the same key before first paint. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      locale: DEFAULT_LOCALE,
      sidebarCollapsed: false,
      autoTrackStudy: true,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setAutoTrackStudy: (autoTrackStudy) => set({ autoTrackStudy }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'dlos-ui',
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        sidebarCollapsed: state.sidebarCollapsed,
        autoTrackStudy: state.autoTrackStudy,
      }),
    },
  ),
);
