import type { LessonKind } from '@dlos/shared';
import type { LessonDef } from './types';

type Level = 'b' | 'i' | 'a';
/** [slug, title, level (b/i/a), minutes, kind?] */
export type LessonTuple = readonly [
  slug: string,
  title: string,
  level: Level,
  minutes: number,
  kind?: LessonKind,
];

const LEVELS = { b: 'beginner', i: 'intermediate', a: 'advanced' } as const;

export function lessons(tuples: readonly LessonTuple[]): LessonDef[] {
  return tuples.map(([slug, title, level, minutes, kind]) => ({
    slug,
    title,
    difficulty: LEVELS[level],
    minutes,
    kind: kind ?? 'lesson',
    status: 'planned',
  }));
}
