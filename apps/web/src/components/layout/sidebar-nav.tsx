import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from '@dlos/ui';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { NAV_GROUPS, SETTINGS_ITEM, type NavItem } from '../../app/navigation';
import { TRACK_STYLE } from '../../lib/tracks';

function NavEntry({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const label = t(item.labelKey);
  const Icon = item.icon;
  const iconColor = item.trackSlug ? TRACK_STYLE[item.trackSlug].text : undefined;

  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40',
          collapsed && 'justify-center px-0',
          isActive &&
            'bg-accent text-accent-foreground before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-1 before:rounded-full before:bg-primary',
        )
      }
    >
      <Icon aria-hidden="true" className={cn('size-[1.15rem] shrink-0', iconColor)} />
      {collapsed ? null : (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {item.planned ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
              {t('nav.planned')}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {label}
        {item.planned ? ` · ${t('nav.planned')}` : ''}
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('nav.primary')}
      className="scrollbar-thin flex-1 overflow-x-hidden overflow-y-auto px-3 py-3"
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.id} className="mb-5">
          {collapsed ? (
            <div className="mx-auto mb-2 h-px w-6 bg-border" aria-hidden="true" />
          ) : (
            <p className="px-3 pb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t(group.labelKey)}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavEntry item={item} collapsed={collapsed} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="border-t pt-3">
        <NavEntry item={SETTINGS_ITEM} collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}
