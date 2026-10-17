import {
  calendarMonthSchema,
  calendarQuerySchema,
  dashboardSchema,
} from '../schemas/dashboard';
import { idParamsSchema, slugParamsSchema } from '../schemas/common';
import {
  courseDetailSchema,
  getTrackResponseSchema,
  lessonDetailSchema,
  lessonProgressResponseSchema,
  listCoursesQuerySchema,
  listCoursesResponseSchema,
  listTracksResponseSchema,
  setLessonProgressSchema,
} from '../schemas/curriculum';
import {
  createPlanTaskSchema,
  planOverviewSchema,
  planTaskSchema,
  planWeekDetailSchema,
  planWeekParamsSchema,
  resetPlanSchema,
  updatePlanSchema,
  updatePlanTaskSchema,
} from '../schemas/plan';
import {
  createAttemptResponseSchema,
  createAttemptSchema,
  listProblemsQuerySchema,
  listProblemsResponseSchema,
  problemDetailSchema,
} from '../schemas/practice';
import { quizDetailSchema, quizResultSchema, submitQuizSchema } from '../schemas/quiz';
import { preferencesSchema, updatePreferencesSchema } from '../schemas/preferences';
import {
  listProjectsResponseSchema,
  projectDetailSchema,
  projectMilestoneParamsSchema,
  setMilestoneSchema,
} from '../schemas/projects';
import { searchQuerySchema, searchResponseSchema } from '../schemas/search';
import {
  createStudySessionSchema,
  listStudySessionsQuerySchema,
  listStudySessionsResponseSchema,
  studySessionSchema,
} from '../schemas/study';
import { healthSchema } from '../schemas/system';
import { defineEndpoint } from './define';

export const getHealth = defineEndpoint({
  id: 'getHealth',
  method: 'get',
  path: '/health',
  summary: 'Service health, database status and AI provider status',
  tags: ['System'],
  response: healthSchema,
});

export const listTracks = defineEndpoint({
  id: 'listTracks',
  method: 'get',
  path: '/tracks',
  summary: 'List the learning tracks with aggregate progress',
  tags: ['Curriculum'],
  response: listTracksResponseSchema,
});

export const getTrack = defineEndpoint({
  id: 'getTrack',
  method: 'get',
  path: '/tracks/:slug',
  summary: 'Get one learning track and its courses',
  tags: ['Curriculum'],
  params: slugParamsSchema,
  response: getTrackResponseSchema,
});

export const listCourses = defineEndpoint({
  id: 'listCourses',
  method: 'get',
  path: '/courses',
  summary: 'Course catalog with optional track, difficulty and text filters',
  tags: ['Curriculum'],
  query: listCoursesQuerySchema,
  response: listCoursesResponseSchema,
});

export const getCourse = defineEndpoint({
  id: 'getCourse',
  method: 'get',
  path: '/courses/:slug',
  summary: 'Get a course with its modules and lessons',
  tags: ['Curriculum'],
  params: slugParamsSchema,
  response: courseDetailSchema,
});

export const getLesson = defineEndpoint({
  id: 'getLesson',
  method: 'get',
  path: '/lessons/:slug',
  summary: 'Get a lesson with its written content, embedded videos and practice problems',
  tags: ['Curriculum'],
  params: slugParamsSchema,
  response: lessonDetailSchema,
});

export const setLessonProgress = defineEndpoint({
  id: 'setLessonProgress',
  method: 'put',
  path: '/lessons/:slug/progress',
  summary: 'Start, complete or reopen a lesson (only lessons with written content)',
  tags: ['Curriculum'],
  params: slugParamsSchema,
  body: setLessonProgressSchema,
  response: lessonProgressResponseSchema,
});

export const getPreferences = defineEndpoint({
  id: 'getPreferences',
  method: 'get',
  path: '/preferences',
  summary: 'Get the local profile preferences',
  tags: ['Preferences'],
  response: preferencesSchema,
});

export const updatePreferences = defineEndpoint({
  id: 'updatePreferences',
  method: 'patch',
  path: '/preferences',
  summary: 'Update the local profile preferences',
  tags: ['Preferences'],
  body: updatePreferencesSchema,
  response: preferencesSchema,
});

export const getPlan = defineEndpoint({
  id: 'getPlan',
  method: 'get',
  path: '/plan',
  summary: 'Get the 24-week study plan overview',
  tags: ['Plan'],
  response: planOverviewSchema,
});

export const updatePlan = defineEndpoint({
  id: 'updatePlan',
  method: 'patch',
  path: '/plan',
  summary: 'Rename the plan or move its start date',
  tags: ['Plan'],
  body: updatePlanSchema,
  response: planOverviewSchema,
});

export const resetPlan = defineEndpoint({
  id: 'resetPlan',
  method: 'post',
  path: '/plan/reset',
  summary: 'Discard all edits and progress and rebuild the plan from the template',
  tags: ['Plan'],
  body: resetPlanSchema,
  response: planOverviewSchema,
});

export const getPlanWeek = defineEndpoint({
  id: 'getPlanWeek',
  method: 'get',
  path: '/plan/weeks/:week',
  summary: 'Get one plan week with its tasks grouped by day',
  tags: ['Plan'],
  params: planWeekParamsSchema,
  response: planWeekDetailSchema,
});

export const createPlanTask = defineEndpoint({
  id: 'createPlanTask',
  method: 'post',
  path: '/plan/tasks',
  summary: 'Add a custom task to the plan',
  tags: ['Plan'],
  body: createPlanTaskSchema,
  response: planTaskSchema,
  status: 201,
});

export const updatePlanTask = defineEndpoint({
  id: 'updatePlanTask',
  method: 'patch',
  path: '/plan/tasks/:id',
  summary: 'Edit, reschedule, complete or reopen a plan task',
  tags: ['Plan'],
  params: idParamsSchema,
  body: updatePlanTaskSchema,
  response: planTaskSchema,
});

export const deletePlanTask = defineEndpoint({
  id: 'deletePlanTask',
  method: 'delete',
  path: '/plan/tasks/:id',
  summary: 'Remove a task from the plan',
  tags: ['Plan'],
  params: idParamsSchema,
  status: 204,
});

export const createStudySession = defineEndpoint({
  id: 'createStudySession',
  method: 'post',
  path: '/study-sessions',
  summary: 'Log a study session',
  tags: ['Study'],
  body: createStudySessionSchema,
  response: studySessionSchema,
  status: 201,
});

export const listStudySessions = defineEndpoint({
  id: 'listStudySessions',
  method: 'get',
  path: '/study-sessions',
  summary: 'List recent study sessions',
  tags: ['Study'],
  query: listStudySessionsQuerySchema,
  response: listStudySessionsResponseSchema,
});

export const deleteStudySession = defineEndpoint({
  id: 'deleteStudySession',
  method: 'delete',
  path: '/study-sessions/:id',
  summary: 'Delete a study session',
  tags: ['Study'],
  params: idParamsSchema,
  status: 204,
});

export const getDashboard = defineEndpoint({
  id: 'getDashboard',
  method: 'get',
  path: '/dashboard',
  summary: 'Aggregated dashboard computed from persisted records',
  tags: ['Dashboard'],
  response: dashboardSchema,
});

export const getCalendarMonth = defineEndpoint({
  id: 'getCalendarMonth',
  method: 'get',
  path: '/calendar',
  summary: 'Per-day study activity for one month',
  tags: ['Dashboard'],
  query: calendarQuerySchema,
  response: calendarMonthSchema,
});

export const searchCatalog = defineEndpoint({
  id: 'searchCatalog',
  method: 'get',
  path: '/search',
  summary: 'Search tracks, courses, lessons and projects',
  tags: ['Search'],
  query: searchQuerySchema,
  response: searchResponseSchema,
});

export const listProjects = defineEndpoint({
  id: 'listProjects',
  method: 'get',
  path: '/projects',
  summary: 'List AI lab projects with personal progress',
  tags: ['Projects'],
  response: listProjectsResponseSchema,
});

export const getProject = defineEndpoint({
  id: 'getProject',
  method: 'get',
  path: '/projects/:slug',
  summary: 'Get a project with its milestone checklist',
  tags: ['Projects'],
  params: slugParamsSchema,
  response: projectDetailSchema,
});

export const startProject = defineEndpoint({
  id: 'startProject',
  method: 'post',
  path: '/projects/:slug/start',
  summary: 'Mark a project as started',
  tags: ['Projects'],
  params: slugParamsSchema,
  response: projectDetailSchema,
});

export const setProjectMilestone = defineEndpoint({
  id: 'setProjectMilestone',
  method: 'put',
  path: '/projects/:slug/milestones/:milestoneId',
  summary: 'Complete or reopen a project milestone',
  tags: ['Projects'],
  params: projectMilestoneParamsSchema,
  body: setMilestoneSchema,
  response: projectDetailSchema,
});

export const listProblems = defineEndpoint({
  id: 'listProblems',
  method: 'get',
  path: '/practice/problems',
  summary: 'List coding problems with personal status and overall progress',
  tags: ['Practice'],
  query: listProblemsQuerySchema,
  response: listProblemsResponseSchema,
});

export const getProblem = defineEndpoint({
  id: 'getProblem',
  method: 'get',
  path: '/practice/problems/:slug',
  summary: 'Get a coding problem with tests, hints, solution and the last saved code',
  tags: ['Practice'],
  params: slugParamsSchema,
  response: problemDetailSchema,
});

export const createAttempt = defineEndpoint({
  id: 'createAttempt',
  method: 'post',
  path: '/practice/problems/:slug/attempts',
  summary: 'Save a run or submission made in the in-browser editor',
  tags: ['Practice'],
  params: slugParamsSchema,
  body: createAttemptSchema,
  response: createAttemptResponseSchema,
  status: 201,
});

export const getQuiz = defineEndpoint({
  id: 'getQuiz',
  method: 'get',
  path: '/quizzes/:slug',
  summary: 'Get the quiz for a lesson (questions only, answers stay on the server)',
  tags: ['Quizzes'],
  params: slugParamsSchema,
  response: quizDetailSchema,
});

export const submitQuiz = defineEndpoint({
  id: 'submitQuiz',
  method: 'post',
  path: '/quizzes/:slug/attempts',
  summary: 'Submit answers, get a score with the correct answers and explanations',
  tags: ['Quizzes'],
  params: slugParamsSchema,
  body: submitQuizSchema,
  response: quizResultSchema,
  status: 201,
});

export const endpoints = [
  getHealth,
  listTracks,
  getTrack,
  listCourses,
  getCourse,
  getLesson,
  setLessonProgress,
  getPreferences,
  updatePreferences,
  getPlan,
  updatePlan,
  resetPlan,
  getPlanWeek,
  createPlanTask,
  updatePlanTask,
  deletePlanTask,
  createStudySession,
  listStudySessions,
  deleteStudySession,
  getDashboard,
  getCalendarMonth,
  searchCatalog,
  listProjects,
  getProject,
  startProject,
  setProjectMilestone,
  listProblems,
  getProblem,
  createAttempt,
  getQuiz,
  submitQuiz,
] as const;
