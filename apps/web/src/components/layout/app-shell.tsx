import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  TooltipProvider,
  cn,
} from '@dlos/ui';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { useUiStore } from '../../stores/ui-store';
import { BottomNav } from './bottom-nav';
import { CommandPalette } from './command-palette';
import { Header } from './header';
import { Logo } from './logo';
import { SidebarNav } from './sidebar-nav';
import { LogStudyDialog, StartTimerDialog } from './study-dialogs';

export function AppShell() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const shownPath = useRef(pathname);

  // Move focus to the page content after a navigation, but never on the first render. Comparing paths (instead
  // of a "first render" flag) also keeps this correct when React runs effects twice in development.
  useEffect(() => {
    if (shownPath.current === pathname) return;
    shownPath.current = pathname;
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <TooltipProvider delayDuration={200}>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('common.skipToContent')}
      </a>

      <div className="flex min-h-dvh">
        <aside
          className={cn(
            'sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex print:hidden',
            collapsed ? 'w-[4.5rem]' : 'w-64',
          )}
        >
          <div className={cn('flex h-16 items-center border-b px-4', collapsed && 'justify-center px-0')}>
            <Logo showName={!collapsed} />
          </div>
          <SidebarNav collapsed={collapsed} />
          <div className="border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn('w-full', collapsed ? 'px-0' : 'justify-start')}
              onClick={toggleSidebar}
              aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
              aria-expanded={!collapsed}
            >
              {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
              {collapsed ? null : <span>{t('nav.collapse')}</span>}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Header onOpenMenu={() => setDrawerOpen(true)} />
          <main
            id="main"
            ref={mainRef}
            tabIndex={-1}
            className="flex-1 pb-20 outline-none md:pb-0"
          >
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>

      <BottomNav onOpenMenu={() => setDrawerOpen(true)} />

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" closeLabel={t('common.close')} className="gap-0 bg-sidebar p-0">
          <SheetTitle className="sr-only">{t('nav.primary')}</SheetTitle>
          <SheetDescription className="sr-only">{t('nav.primary')}</SheetDescription>
          <div className="flex h-16 items-center border-b px-4">
            <Logo />
          </div>
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <CommandPalette />
      <LogStudyDialog />
      <StartTimerDialog />
      <ScrollRestoration />
    </TooltipProvider>
  );
}
