import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Kbd,
} from '@dlos/ui';
import { Menu, Search, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { usePreferences } from '../../lib/queries';
import { useOverlayStore } from '../../stores/overlay-store';
import { Logo } from './logo';
import { LanguageSwitcher, ThemeToggle } from './preferences-menus';
import { TimerChip } from './study-dialogs';

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setCommandOpen = useOverlayStore((state) => state.setCommandOpen);
  const preferences = usePreferences();
  const name = preferences.data?.displayName ?? '';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur-md sm:px-4 lg:px-6 print:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={t('nav.openMenu')}
        onClick={onOpenMenu}
      >
        <Menu aria-hidden="true" />
      </Button>
      <Logo showName={false} className="lg:hidden" />

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="ml-1 hidden h-10 w-full max-w-md items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-xs outline-none transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 md:flex"
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="flex-1 truncate text-left">{t('header.search')}</span>
        <Kbd>Ctrl K</Kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label={t('header.searchLabel')}
          onClick={() => setCommandOpen(true)}
        >
          <Search aria-hidden="true" />
        </Button>
        <TimerChip />
        <LanguageSwitcher />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label={t('header.account')}>
              <Avatar name={name || 'Learner'} className="size-8" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings aria-hidden="true" />
                {t('nav.items.settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void navigate('/roadmap')}>
              {t('nav.items.roadmap')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
