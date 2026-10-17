import { cn } from '@dlos/ui';
import { CodeXml, FlaskConical, GraduationCap, LayoutDashboard, Menu, type LucideIcon } from 'lucide-react';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

const ITEMS: Array<{ to: string; labelKey: ParseKeys; icon: LucideIcon }> = [
  { to: '/dashboard', labelKey: 'nav.bottom.dashboard', icon: LayoutDashboard },
  { to: '/learn', labelKey: 'nav.bottom.learn', icon: GraduationCap },
  { to: '/practice', labelKey: 'nav.bottom.practice', icon: CodeXml },
  { to: '/projects', labelKey: 'nav.bottom.projects', icon: FlaskConical },
];

const itemClass =
  'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] font-medium outline-none transition-colors focus-visible:bg-accent';

/** Thumb-reach navigation for phones; the full menu lives in the drawer. */
export function BottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('nav.primary')}
      className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden print:hidden"
    >
      {ITEMS.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(itemClass, isActive ? 'text-brand' : 'text-muted-foreground hover:text-foreground')
          }
        >
          <Icon aria-hidden="true" className="size-5" />
          {t(labelKey)}
        </NavLink>
      ))}
      <button type="button" onClick={onOpenMenu} className={cn(itemClass, 'text-muted-foreground')}>
        <Menu aria-hidden="true" className="size-5" />
        {t('nav.bottom.menu')}
      </button>
    </nav>
  );
}
