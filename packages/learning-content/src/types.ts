import type {
  ContentStatus,
  Difficulty,
  LessonKind,
  PlanTaskKind,
  TrackSlug,
} from '@dlos/shared';

/** Icon identifiers resolved to Lucide components by the web app. */
export const ICON_IDS = [
  'brain',
  'sparkles',
  'database',
  'workflow',
  'git-branch',
  'rocket',
  'binary',
  'boxes',
  'network',
  'cpu',
  'server',
  'layers',
  'code',
  'target',
  'shield',
  'cloud',
  'flask',
  'terminal',
  'languages',
  'mic',
  'message-circle',
  'briefcase',
  'headphones',
] as const;
export type IconId = (typeof ICON_IDS)[number];

export interface LessonDef {
  slug: string;
  title: string;
  difficulty: Difficulty;
  /** Estimated reading/study time in minutes. */
  minutes: number;
  kind: LessonKind;
  summary?: string;
  tags?: string[];
  /** Honest authoring status. Only lessons with real written content may be `complete`. */
  status: ContentStatus;
}

export interface ModuleDef {
  slug: string;
  title: string;
  description: string;
  lessons: LessonDef[];
}

export interface CourseDef {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: Difficulty;
  icon: IconId;
  tags: string[];
  outcomes: string[];
  modules: ModuleDef[];
}

export interface TrackDef {
  slug: TrackSlug;
  title: string;
  shortTitle: string;
  description: string;
  icon: IconId;
  courses: CourseDef[];
}

export interface LessonSlot {
  title: string;
  kind: PlanTaskKind;
  minutes?: number;
  /** Optional link to a curriculum lesson. */
  lesson?: string;
  description?: string;
}
/** A bare string is a curriculum lesson slug scheduled with the default title and kind. */
export type SlotDef = string | LessonSlot;

export interface LabSlot {
  title: string;
  minutes: number;
  /** Project slug when the session advances one of the AI labs. */
  project?: string;
  kind?: PlanTaskKind;
}

export interface RoadmapPhaseDef {
  key: string;
  title: string;
  summary: string;
  weekStart: number;
  weekEnd: number;
}

export interface RoadmapWeekDef {
  week: number;
  phase: string;
  title: string;
  summary: string;
  goals: string[];
  deliverable: string;
  /** Exactly five entries: Monday to Friday of the plan week. */
  ai: SlotDef[];
  dsa: SlotDef[];
  systemDesign: SlotDef[];
  /** Day 6 of the plan week: lab or project session (optional). */
  lab: LabSlot;
  /** Day 7 of the plan week: optional full-stack revision (one or two lessons). */
  fullStack: SlotDef[];
  /** Day 7 of the plan week: optional interview practice. */
  interview: SlotDef;
}

export interface ProjectDef {
  slug: string;
  title: string;
  goal: string;
  summary: string;
  difficulty: Difficulty;
  estimatedHours: number;
  prerequisites: string[];
  stack: string[];
  milestones: ReadonlyArray<readonly [title: string, description: string]>;
}
