import type { ProblemDifficulty, ProblemStatus } from '@dlos/shared';
import { Badge } from '@dlos/ui';
import { Circle, CircleCheck, CircleDot } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ProblemStatusIcon({ status }: { status: ProblemStatus }) {
  const { t } = useTranslation();
  const label = t(`practice.status.${status}`);
  if (status === 'solved') return <CircleCheck role="img" aria-label={label} className="size-5 shrink-0 text-success" />;
  if (status === 'attempted') return <CircleDot role="img" aria-label={label} className="size-5 shrink-0 text-warning" />;
  return <Circle role="img" aria-label={label} className="size-5 shrink-0 text-muted-foreground" />;
}

const VARIANT = { easy: 'success', medium: 'warning', hard: 'destructive' } as const;

export function DifficultyPill({ difficulty }: { difficulty: ProblemDifficulty }) {
  const { t } = useTranslation();
  return <Badge variant={VARIANT[difficulty]}>{t(`practice.difficulty.${difficulty}`)}</Badge>;
}
