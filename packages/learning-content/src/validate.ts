import {
  CORE_DAYS_PER_WEEK,
  DIFFICULTIES,
  ROADMAP_WEEK_COUNT,
  TRACK_SLUGS,
  extractHeadings,
  runTests,
} from '@dlos/shared';
import { curriculum } from './curriculum';
import { loadLessonFiles, loadProblemFiles, loadQuizFiles, loadVideoRegistry } from './files';
import { projects } from './projects';
import { expandRoadmap, indexLessons, roadmapPhases, roadmapWeeks } from './roadmap';
import { ICON_IDS } from './types';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes];
}

/** Returns human-readable problems; an empty array means the content is consistent. */
export function validateContent(): string[] {
  const problems: string[] = [];
  const icons = new Set<string>(ICON_IDS);

  const trackSlugs = curriculum.map((track) => track.slug);
  if (trackSlugs.join() !== TRACK_SLUGS.join()) {
    problems.push(`Tracks must be exactly [${TRACK_SLUGS.join(', ')}] in order, got [${trackSlugs.join(', ')}]`);
  }

  const courseSlugs: string[] = [];
  const lessonSlugs: string[] = [];
  for (const track of curriculum) {
    if (!icons.has(track.icon)) problems.push(`Track ${track.slug}: unknown icon "${track.icon}"`);
    for (const course of track.courses) {
      courseSlugs.push(course.slug);
      if (!SLUG.test(course.slug)) problems.push(`Course slug is not kebab-case: ${course.slug}`);
      if (!icons.has(course.icon)) problems.push(`Course ${course.slug}: unknown icon "${course.icon}"`);
      if (!DIFFICULTIES.includes(course.difficulty)) {
        problems.push(`Course ${course.slug}: invalid difficulty`);
      }
      if (course.outcomes.length < 3) problems.push(`Course ${course.slug}: needs at least 3 outcomes`);
      const moduleSlugs = course.modules.map((module) => module.slug);
      for (const dupe of duplicates(moduleSlugs)) {
        problems.push(`Course ${course.slug}: duplicate module slug ${dupe}`);
      }
      for (const module of course.modules) {
        if (module.lessons.length === 0) {
          problems.push(`Module ${course.slug}/${module.slug} has no lessons`);
        }
        for (const lesson of module.lessons) {
          lessonSlugs.push(lesson.slug);
          if (!SLUG.test(lesson.slug)) problems.push(`Lesson slug is not kebab-case: ${lesson.slug}`);
          if (lesson.minutes < 10 || lesson.minutes > 120) {
            problems.push(`Lesson ${lesson.slug}: minutes must be 10-120`);
          }
        }
      }
    }
  }
  for (const dupe of duplicates(courseSlugs)) problems.push(`Duplicate course slug: ${dupe}`);
  for (const dupe of duplicates(lessonSlugs)) problems.push(`Duplicate lesson slug: ${dupe}`);

  const lessons = indexLessons();
  const phaseKeys = new Set(roadmapPhases.map((phase) => phase.key));
  const projectSlugs = new Set(projects.map((project) => project.slug));

  if (roadmapWeeks.length !== ROADMAP_WEEK_COUNT) {
    problems.push(`Roadmap must define ${ROADMAP_WEEK_COUNT} weeks, found ${roadmapWeeks.length}`);
  }

  const scheduled = new Map<string, number>();
  roadmapWeeks.forEach((week, index) => {
    if (week.week !== index + 1) problems.push(`Roadmap week ${index + 1} has number ${week.week}`);
    if (!phaseKeys.has(week.phase)) problems.push(`Week ${week.week}: unknown phase ${week.phase}`);
    const phase = roadmapPhases.find((candidate) => candidate.key === week.phase);
    if (phase && (week.week < phase.weekStart || week.week > phase.weekEnd)) {
      problems.push(`Week ${week.week} is outside the range of phase ${week.phase}`);
    }
    if (week.goals.length < 3) problems.push(`Week ${week.week}: needs at least 3 goals`);
    for (const [name, slots] of [
      ['ai', week.ai],
      ['dsa', week.dsa],
      ['systemDesign', week.systemDesign],
    ] as const) {
      if (slots.length !== CORE_DAYS_PER_WEEK) {
        problems.push(`Week ${week.week}: ${name} needs exactly ${CORE_DAYS_PER_WEEK} slots`);
      }
    }
    const allSlots = [
      ...week.ai,
      ...week.dsa,
      ...week.systemDesign,
      ...week.fullStack,
      week.interview,
    ];
    for (const slot of allSlots) {
      const slug = typeof slot === 'string' ? slot : slot.lesson;
      if (!slug) continue;
      if (!lessons.has(slug)) problems.push(`Week ${week.week}: unknown lesson "${slug}"`);
      scheduled.set(slug, (scheduled.get(slug) ?? 0) + 1);
    }
    if (week.lab.project && !projectSlugs.has(week.lab.project)) {
      problems.push(`Week ${week.week}: unknown project "${week.lab.project}"`);
    }
  });

  /** Self-paced tracks are studied outside the 24-week roadmap. */
  const selfPaced = new Set(
    curriculum
      .filter((track) => track.slug === 'english')
      .flatMap((track) =>
        track.courses.flatMap((course) => course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.slug))),
      ),
  );

  const caseStudySlugs = new Set(
    curriculum.flatMap((track) =>
      track.courses.flatMap((course) =>
        course.modules.flatMap((module) =>
          module.lessons.filter((lesson) => lesson.kind === 'case-study').map((lesson) => lesson.slug),
        ),
      ),
    ),
  );
  for (const [slug, count] of scheduled) {
    const allowed = caseStudySlugs.has(slug) ? 2 : 1;
    if (count > allowed) problems.push(`Lesson "${slug}" is scheduled ${count} times (max ${allowed})`);
  }
  for (const slug of lessons.keys()) {
    if (!scheduled.has(slug) && !selfPaced.has(slug)) {
      problems.push(`Lesson "${slug}" is not scheduled in the roadmap`);
    }
  }

  for (const project of projects) {
    if (!SLUG.test(project.slug)) problems.push(`Project slug is not kebab-case: ${project.slug}`);
    if (project.milestones.length < 3) problems.push(`Project ${project.slug}: needs 3+ milestones`);
    for (const prerequisite of project.prerequisites) {
      if (!lessons.has(prerequisite) && !projectSlugs.has(prerequisite)) {
        problems.push(`Project ${project.slug}: unknown prerequisite "${prerequisite}"`);
      }
    }
  }
  for (const dupe of duplicates(projects.map((project) => project.slug))) {
    problems.push(`Duplicate project slug: ${dupe}`);
  }
  if (projects.length !== 10) problems.push(`Expected 10 AI labs, found ${projects.length}`);

  problems.push(...validateAuthoredFiles(new Set(lessons.keys())));

  return problems;
}

/** Lesson markdown, the video registry and the coding problems, including their reference solutions. */
function validateAuthoredFiles(lessonSlugs: ReadonlySet<string>): string[] {
  const problems: string[] = [];

  const registry = loadVideoRegistry();
  const videoIds = new Set(registry.map((video) => video.id));
  for (const dupe of duplicates(registry.map((video) => video.id))) problems.push(`Duplicate video id: ${dupe}`);
  const unverified = registry.filter((video) => !video.verifiedAt).map((video) => video.id);
  if (unverified.length > 0) {
    problems.push(`Videos not verified yet (run pnpm content:videos): ${unverified.join(', ')}`);
  }

  for (const file of loadLessonFiles()) {
    const where = `lessons/${file.slug}.md`;
    if (!lessonSlugs.has(file.slug)) problems.push(`${where}: no lesson with this slug in the curriculum`);
    if (file.body.length < 1500) problems.push(`${where}: body is too short to be a real lesson (${file.body.length} characters)`);
    for (const id of file.videoIds) {
      if (!videoIds.has(id)) problems.push(`${where}: video ${id} is not in videos.yaml`);
    }
    const headings = extractHeadings(file.body);
    if (headings.some((heading) => heading.level === 1)) problems.push(`${where}: use ## headings, the page title is the lesson title`);
    for (const dupe of duplicates(headings.map((heading) => heading.id))) {
      problems.push(`${where}: duplicate heading anchor "${dupe}"`);
    }
  }

  const authoredLessons = new Set(loadLessonFiles().map((file) => file.slug));
  for (const quiz of loadQuizFiles()) {
    const where = `quizzes/${quiz.slug}.yaml`;
    if (!authoredLessons.has(quiz.slug)) problems.push(`${where}: needs a lesson file lessons/${quiz.slug}.md`);
    for (const dupe of duplicates(quiz.questions.map((question) => question.prompt))) {
      problems.push(`${where}: duplicate question "${dupe}"`);
    }
  }

  const problemFiles = loadProblemFiles();
  for (const dupe of duplicates(problemFiles.map((problem) => problem.slug))) {
    problems.push(`Duplicate problem slug: ${dupe}`);
  }
  for (const problem of problemFiles) {
    const where = `problems/${problem.slug}.yaml`;
    if (problem.lesson && !lessonSlugs.has(problem.lesson)) problems.push(`${where}: unknown lesson "${problem.lesson}"`);
    for (const id of problem.videos) {
      if (!videoIds.has(id)) problems.push(`${where}: video ${id} is not in videos.yaml`);
    }
    if (!problem.starter.includes(problem.function)) problems.push(`${where}: starter code must define ${problem.function}`);
    if (!problem.tests.some((test) => test.hidden)) problems.push(`${where}: add some hidden tests`);
    if (problem.tests.every((test) => test.hidden)) problems.push(`${where}: at least one test must be visible`);

    const config = {
      functionName: problem.function,
      argCodecs: problem.args,
      returnCodec: problem.returns,
      ordering: problem.ordering,
      inPlace: problem.inPlace,
      float: problem.float,
    };
    const reference = runTests(problem.solutionJavaScript, config, problem.tests);
    if (reference.compileError) {
      problems.push(`${where}: reference solution does not compile: ${reference.compileError}`);
    }
    for (const result of reference.results.filter((candidate) => !candidate.passed)) {
      problems.push(
        `${where}: reference solution fails test #${result.index + 1}: args ${result.args} expected ${result.expected} got ${result.actual}${result.error ? ` (${result.error})` : ''}`,
      );
    }
    const starter = runTests(problem.starterJavaScript, config, problem.tests);
    if (starter.compileError) problems.push(`${where}: starter code does not compile: ${starter.compileError}`);
    else if (starter.results.length > 0 && starter.results.every((result) => result.passed)) {
      problems.push(`${where}: the starter code already passes every test`);
    }
  }

  return problems;
}

export function getContentStats() {
  const lessons = indexLessons();
  const authored = new Set(loadLessonFiles().map((file) => file.slug));
  const byStatus = { planned: 0, in_progress: 0, complete: 0 };
  const lessonsByTrack: Record<string, number> = {};
  let courses = 0;
  let modules = 0;
  for (const track of curriculum) {
    lessonsByTrack[track.slug] = 0;
    for (const course of track.courses) {
      courses += 1;
      for (const module of course.modules) {
        modules += 1;
        for (const lesson of module.lessons) {
          byStatus[authored.has(lesson.slug) ? 'complete' : lesson.status] += 1;
          lessonsByTrack[track.slug] = (lessonsByTrack[track.slug] ?? 0) + 1;
        }
      }
    }
  }
  const tasks = expandRoadmap();
  return {
    tracks: curriculum.length,
    courses,
    modules,
    lessons: lessons.size,
    lessonsByTrack,
    lessonsByStatus: byStatus,
    roadmapWeeks: roadmapWeeks.length,
    roadmapTasks: tasks.length,
    roadmapCoreTasks: tasks.filter((task) => !task.isOptional).length,
    projects: projects.length,
    projectMilestones: projects.reduce((sum, project) => sum + project.milestones.length, 0),
    problems: loadProblemFiles().length,
    videos: loadVideoRegistry().length,
  };
}
