import { Button, ErrorState } from '@dlos/ui';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { PageContainer } from '../../components/page';

export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : undefined;

  return (
    <PageContainer className="min-h-dvh justify-center">
      <ErrorState title={t('errors.routeTitle')} description={detail ? `${t('errors.routeBody')} (${detail})` : t('errors.routeBody')} />
      <div className="flex justify-center">
        <Button onClick={() => window.location.reload()}>{t('errors.reload')}</Button>
      </div>
    </PageContainer>
  );
}
