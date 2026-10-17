import { useTranslation } from 'react-i18next';
import { LogoMark } from './layout/logo';

/** Shown while the first route chunk loads, so the page never flashes blank. */
export function AppLoading() {
  const { t } = useTranslation();
  return (
    <div role="status" className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <LogoMark className="size-12 animate-pulse motion-reduce:animate-none" />
        <span className="text-sm">{t('common.loading')}</span>
      </div>
    </div>
  );
}
