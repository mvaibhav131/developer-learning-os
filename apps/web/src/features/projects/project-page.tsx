import type { ProjectDetail } from '@dlos/shared';
import { Badge, Button, Card, CardContent, Checkbox, ProgressRing, Skeleton, toast } from '@dlos/ui';
import { ChevronRight, Clock, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ContentStatusBadge, DifficultyBadge } from '../../components/badges';
import { PageContainer, PageHeader, QueryBoundary, SectionCard } from '../../components/page';
import { useFormatters } from '../../lib/format';
import { useProject, useSetMilestone, useStartProject } from '../../lib/queries';
import { ProjectStatusBadge } from './projects-page';

function ProjectContent({ data }: { data: ProjectDetail }) {
  const { t } = useTranslation();
  const format = useFormatters();
  const start = useStartProject();
  const setMilestone = useSetMilestone();
  const { project, milestones } = data;
  const percent = project.milestonesTotal > 0 ? Math.round((project.milestonesDone / project.milestonesTotal) * 100) : 0;

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground hover:underline">
          {t('projects.title')}
        </Link>
        <ChevronRight aria-hidden="true" className="size-4" />
      </nav>
      <PageHeader
        title={project.title}
        description={project.goal}
        actions={
          project.status === 'not_started' ? (
            <Button
              disabled={start.isPending}
              onClick={() =>
                start.mutate(project.slug, {
                  onSuccess: () => toast.success(t('projects.started')),
                  onError: () => toast.error(t('common.errorTitle')),
                })
              }
            >
              <Rocket aria-hidden="true" />
              {t('projects.start')}
            </Button>
          ) : null
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <ProjectStatusBadge status={project.status} />
        <DifficultyBadge difficulty={project.difficulty} />
        <ContentStatusBadge status={project.contentStatus} />
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Clock aria-hidden="true" className="size-4" />
          {t('projects.hours', { value: format.number(project.estimatedHours) })}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title={t('projects.summary')}>
            <p className="text-muted-foreground">{project.summary}</p>
          </SectionCard>

          <SectionCard
            title={t('projects.milestones')}
            description={t('projects.milestonesDone', { done: project.milestonesDone, total: project.milestonesTotal })}
          >
            <ol className="space-y-2">
              {milestones.map((milestone, index) => {
                const done = milestone.completedAt !== null;
                return (
                  <li key={milestone.id} className="flex items-start gap-3 rounded-xl border bg-card/60 p-3">
                    <span className="-m-1.5 p-1.5">
                      <Checkbox
                        checked={done}
                        disabled={setMilestone.isPending}
                        aria-label={t('projects.markDone', { title: milestone.title })}
                        onCheckedChange={(checked) =>
                          setMilestone.mutate(
                            { slug: project.slug, milestoneId: milestone.id, completed: checked === true },
                            { onError: () => toast.error(t('common.errorTitle')) },
                          )
                        }
                      />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p className={done ? 'font-medium text-muted-foreground line-through' : 'font-medium'}>
                        {index + 1}. {milestone.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-center gap-4">
              <ProgressRing value={percent} label={project.title} size={88} strokeWidth={8}>
                <span className="text-lg font-semibold tabular-nums">{percent}%</span>
              </ProgressRing>
              <div className="min-w-0 text-sm">
                <p className="font-medium">{t('projects.milestones')}</p>
                <p className="text-muted-foreground tabular-nums">
                  {t('projects.milestonesDone', { done: project.milestonesDone, total: project.milestonesTotal })}
                </p>
              </div>
            </CardContent>
          </Card>

          <SectionCard title={t('projects.stack')} description={t('projects.stackNote')}>
            <ul className="flex flex-wrap gap-2">
              {project.stack.map((item) => (
                <li key={item}>
                  <Badge variant="secondary">{item}</Badge>
                </li>
              ))}
            </ul>
          </SectionCard>

          {project.prerequisites.length > 0 ? (
            <SectionCard title={t('projects.prerequisites')}>
              <ul className="space-y-2 text-sm">
                {project.prerequisites.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={item.type === 'project' ? `/projects/${item.slug}` : `/lessons/${item.slug}`}
                      className="font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          <SectionCard title={t('projects.guide')}>
            <p className="text-sm text-muted-foreground">{t('projects.guidePlanned')}</p>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

export function Component() {
  const { slug = '' } = useParams();
  const project = useProject(slug);
  return (
    <PageContainer>
      <QueryBoundary
        query={project}
        skeleton={
          <div className="space-y-6" aria-hidden="true">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-64" />
          </div>
        }
      >
        {(data) => <ProjectContent data={data} />}
      </QueryBoundary>
    </PageContainer>
  );
}
