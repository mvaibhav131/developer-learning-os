import type { UseQueryResult } from '@tanstack/react-query';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  cn,
} from '@dlos/ui';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../lib/hooks';

export function PageContainer({
  children,
  className,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:px-8 lg:py-8',
        wide ? 'max-w-[1500px]' : 'max-w-7xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  documentTitle,
}: {
  title: string;
  description?: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  documentTitle?: string;
}) {
  usePageTitle(documentTitle ?? title);
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? <div className="text-sm text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-pretty text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionCard({
  title,
  description,
  action,
  icon: Icon,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon ? <Icon aria-hidden="true" className="size-4 text-brand" /> : null}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accentClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  accentClassName?: string;
}) {
  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex items-start gap-3 px-4 sm:px-5">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground',
            accentClassName,
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl leading-tight font-semibold tracking-tight tabular-nums">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function QueryBoundary<T>({
  query,
  skeleton,
  children,
}: {
  query: UseQueryResult<T, Error>;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}) {
  const { t } = useTranslation();
  if (query.isPending) return <>{skeleton}</>;
  // A failed background refetch keeps showing the last good data instead of blanking the page.
  if (query.data === undefined) {
    return (
      <ErrorState
        title={t('common.errorTitle')}
        description={t('common.errorBody')}
        retryLabel={t('common.retry')}
        onRetry={() => void query.refetch()}
      />
    );
  }
  return <>{children(query.data)}</>;
}
