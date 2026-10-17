import { Button } from '@dlos/ui';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { PageContainer } from '../../components/page';
import { usePageTitle } from '../../lib/hooks';

export function Component() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  usePageTitle(t('notFound.title'));
  return (
    <PageContainer className="items-center py-16 text-center sm:py-24">
      <p
        aria-hidden="true"
        className="bg-linear-to-br from-primary to-track-ai bg-clip-text text-7xl font-bold tracking-tighter text-transparent sm:text-9xl"
      >
        404
      </p>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t('notFound.title')}</h1>
        <p className="break-all text-muted-foreground">{t('notFound.body', { path: pathname })}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/dashboard">{t('notFound.home')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/courses">{t('notFound.courses')}</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
