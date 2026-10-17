export { curriculum } from './curriculum';
export {
  clearContentCache,
  contentRoot,
  loadLessonFiles,
  loadProblemFiles,
  loadQuizFiles,
  loadVideoRegistry,
  stripTypes,
} from './files';
export type { LessonFile, ProblemFile, QuizFile, QuizQuestionDef, VideoDef } from './files';
export { projects } from './projects';
export { expandRoadmap, indexLessons, roadmapPhases, roadmapWeeks } from './roadmap';
export type { LessonIndexEntry, PlannedTask } from './roadmap';
export { ICON_IDS } from './types';
export type {
  CourseDef,
  IconId,
  LabSlot,
  LessonDef,
  LessonSlot,
  ModuleDef,
  ProjectDef,
  RoadmapPhaseDef,
  RoadmapWeekDef,
  SlotDef,
  TrackDef,
} from './types';
export { getContentStats, validateContent } from './validate';
