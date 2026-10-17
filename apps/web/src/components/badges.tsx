import type { ContentStatus, Difficulty, PlanTaskKind, ProgressStatus, TrackSlug } from '@dlos/shared';
import { Badge } from '@dlos/ui';
import { CircleCheck, CircleDashed, CircleDot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TRACK_STYLE } from '../lib/tracks';

export function TrackBadge({ track, className }: { track: TrackSlug; className?: string }) {
  const { t } = useTranslation();
  const style = TRACK_STYLE[track];
  const Icon = style.icon;
  return (
    <Badge variant={style.badge} className={className}>
      <Icon aria-hidden="true" />
      {t(`tracks.${track}`)}
    </Badge>
  );
}

const DIFFICULTY_VARIANT = {
  beginner: 'success',
  intermediate: 'info',
  advanced: 'warning',
} as const;

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { t } = useTranslation();
  return <Badge variant={DIFFICULTY_VARIANT[difficulty]}>{t(`difficulty.${difficulty}`)}</Badge>;
}

const CONTENT_STATUS_STYLE = {
  planned: { variant: 'secondary', icon: CircleDashed },
  in_progress: { variant: 'info', icon: CircleDot },
  complete: { variant: 'success', icon: CircleCheck },
} as const;

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const { t } = useTranslation();
  const { variant, icon: Icon } = CONTENT_STATUS_STYLE[status];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden="true" />
      {t(`contentStatus.${status}`)}
    </Badge>
  );
}

export function ProgressStatusBadge({ status }: { status: ProgressStatus }) {
  const { t } = useTranslation();
  const variant =
    status === 'completed' ? 'success' : status === 'in_progress' ? 'info' : 'outline';
  return <Badge variant={variant}>{t(`progressStatus.${status}`)}</Badge>;
}

export function TaskKindBadge({ kind }: { kind: PlanTaskKind }) {
  const { t } = useTranslation();
  return <Badge variant="outline">{t(`taskKind.${kind}`)}</Badge>;
}
