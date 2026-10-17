import { getContentStats, validateContent } from './validate';

const problems = validateContent();
const stats = getContentStats();

console.log('Learning content summary');
console.table({
  tracks: stats.tracks,
  courses: stats.courses,
  modules: stats.modules,
  lessons: stats.lessons,
  'lessons: planned': stats.lessonsByStatus.planned,
  'lessons: in progress': stats.lessonsByStatus.in_progress,
  'lessons: complete': stats.lessonsByStatus.complete,
  'roadmap weeks': stats.roadmapWeeks,
  'roadmap tasks': stats.roadmapTasks,
  'roadmap core tasks': stats.roadmapCoreTasks,
  'AI labs': stats.projects,
  'lab milestones': stats.projectMilestones,
  'coding problems': stats.problems,
  'registered videos': stats.videos,
});

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s) found:`);
  for (const problem of problems) console.error(` - ${problem}`);
  process.exitCode = 1;
} else {
  console.log('\nContent is consistent.');
}
