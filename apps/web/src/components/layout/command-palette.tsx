import type { SearchResult } from '@dlos/shared';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@dlos/ui';
import { BookOpen, CodeXml, FlaskConical, GraduationCap, Moon, Play, Search, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ALL_NAV_ITEMS } from '../../app/navigation';
import { useDebouncedValue } from '../../lib/hooks';
import { useSearch, useUpdatePreferences } from '../../lib/queries';
import { TRACK_STYLE } from '../../lib/tracks';
import { useOverlayStore } from '../../stores/overlay-store';
import { useUiStore } from '../../stores/ui-store';

const TYPE_ICON = {
  track: GraduationCap,
  course: BookOpen,
  lesson: Play,
  project: FlaskConical,
  problem: CodeXml,
} as const;

function hrefFor(result: SearchResult): string {
  switch (result.type) {
    case 'track':
      return `/learn/${result.slug}`;
    case 'course':
      return `/courses/${result.slug}`;
    case 'lesson':
      return `/lessons/${result.slug}`;
    case 'project':
      return `/projects/${result.slug}`;
    case 'problem':
      return `/practice/${result.slug}`;
  }
}

/** Ctrl/Cmd+K (or "/") opens the global search; results come from the API, pages are filtered locally. */
export function CommandPalette() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const open = useOverlayStore((state) => state.commandOpen);
  const setOpen = useOverlayStore((state) => state.setCommandOpen);
  const openLogSession = useOverlayStore((state) => state.openLogSession);
  const setTimerDialogOpen = useOverlayStore((state) => state.setTimerDialogOpen);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const updatePreferences = useUpdatePreferences();

  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim(), 200);
  const search = useSearch(debounced);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true;
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        setOpen(!useOverlayStore.getState().commandOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };
  const go = (href: string) => {
    close();
    void navigate(href);
  };

  const needle = query.trim().toLowerCase();
  const pages = ALL_NAV_ITEMS.filter((item) => !needle || t(item.labelKey).toLowerCase().includes(needle));
  const results = search.data?.results ?? [];

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    updatePreferences.mutate({ theme: next });
    close();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      title={t('command.title')}
      description={t('command.description')}
      closeLabel={t('common.close')}
      commandProps={{ shouldFilter: false, label: t('command.title') }}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t('command.placeholder')}
        aria-label={t('command.title')}
      />
      <CommandList>
        <CommandEmpty>
          {needle.length < 2 ? t('command.hint') : search.isFetching ? t('common.loading') : t('command.empty')}
        </CommandEmpty>

        {results.length > 0 ? (
          <CommandGroup heading={t('command.results')}>
            {results.map((result) => {
              const Icon = TYPE_ICON[result.type];
              const color = result.trackSlug ? TRACK_STYLE[result.trackSlug].text : '';
              return (
                <CommandItem
                  key={`${result.type}:${result.slug}`}
                  value={`${result.type}:${result.slug}`}
                  onSelect={() => go(hrefFor(result))}
                >
                  <Icon aria-hidden="true" className={color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{result.title}</span>
                    {result.subtitle ? (
                      <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">{t(`command.types.${result.type}`)}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}

        {pages.length > 0 ? (
          <CommandGroup heading={t('command.pages')}>
            {pages.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.to} value={`page:${item.to}`} onSelect={() => go(item.to)}>
                  <Icon aria-hidden="true" />
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {item.planned ? (
                    <span className="text-xs text-muted-foreground">{t('nav.planned')}</span>
                  ) : null}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}

        {needle.length < 2 ? (
          <CommandGroup heading={t('command.actions')}>
            <CommandItem
              value="action:log"
              onSelect={() => {
                close();
                openLogSession();
              }}
            >
              <Search aria-hidden="true" />
              {t('command.logStudy')}
            </CommandItem>
            <CommandItem
              value="action:timer"
              onSelect={() => {
                close();
                setTimerDialogOpen(true);
              }}
            >
              <Timer aria-hidden="true" />
              {t('command.startTimer')}
            </CommandItem>
            <CommandItem value="action:theme" onSelect={toggleTheme}>
              <Moon aria-hidden="true" />
              {t('command.toggleTheme')}
            </CommandItem>
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
