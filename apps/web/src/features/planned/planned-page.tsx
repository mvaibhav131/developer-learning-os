import { Badge, Button, Card, CardContent } from '@dlos/ui';
import type { ParseKeys } from 'i18next';
import { Hammer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { PLANNED_ROUTES } from '../../app/navigation';
import { PageContainer, PageHeader } from '../../components/page';

type Feature = (typeof PLANNED_ROUTES)[number]['feature'];

/** Honest placeholder: states what will exist and when, and shows no fake data. */
export function PlannedPage({
  feature,
  phase,
  titleKey,
}: {
  feature: Feature;
  phase: number;
  titleKey: ParseKeys;
}) {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader
        title={t(titleKey)}
        eyebrow={<Badge variant="warning">{t('planned.badge', { phase })}</Badge>}
        description={t(`planned.features.${feature}`)}
      />
      <Card>
        <CardContent className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Hammer aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="font-semibold">{t('planned.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('planned.body')}</p>
          </div>
        </CardContent>
      </Card>
      <section aria-labelledby="planned-next" className="space-y-3">
        <h2 id="planned-next" className="text-lg font-semibold tracking-tight">
          {t('planned.whatNext')}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/roadmap">{t('planned.openRoadmap')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/courses">{t('planned.openCourses')}</Link>
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}
