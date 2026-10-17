import { LOCALE_LABELS, LOCALES, type Locale } from '@dlos/shared';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dlos/ui';
import { Languages, Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUpdatePreferences } from '../../lib/queries';
import { useUiStore } from '../../stores/ui-store';
import type { Theme } from '@dlos/shared';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const locale = useUiStore((state) => state.locale);
  const setLocale = useUiStore((state) => state.setLocale);
  const update = useUpdatePreferences();

  const change = (value: string) => {
    const next = value as Locale;
    setLocale(next);
    update.mutate({ locale: next });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`${t('header.language')}: ${LOCALE_LABELS[locale].native}`}>
          <Languages aria-hidden="true" />
          <span className="hidden sm:inline">{LOCALE_LABELS[locale].native}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{t('header.language')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={change}>
          {LOCALES.map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              {LOCALE_LABELS[code].native}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <p className="px-2.5 py-2 text-xs text-muted-foreground">{t('header.languageHint')}</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor } as const;

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const update = useUpdatePreferences();
  const Icon = THEME_ICON[theme];

  const change = (value: string) => {
    const next = value as Theme;
    setTheme(next);
    update.mutate({ theme: next });
  };

  const labels: Record<Theme, string> = {
    light: t('header.themeLight'),
    dark: t('header.themeDark'),
    system: t('header.themeSystem'),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`${t('header.theme')}: ${labels[theme]}`}>
          <Icon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('header.theme')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={change}>
          {(['light', 'dark', 'system'] as const).map((value) => {
            const OptionIcon = THEME_ICON[value];
            return (
              <DropdownMenuRadioItem key={value} value={value}>
                <OptionIcon aria-hidden="true" />
                {labels[value]}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
