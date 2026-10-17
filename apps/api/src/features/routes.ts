import * as api from '@dlos/shared';
import { Router } from 'express';
import type { AppContext } from '../core/context';
import { registerRoute } from '../core/http/register-route';
import { getCalendarMonth } from './calendar/calendar.service';
import {
  getCourse,
  getLesson,
  getTrack,
  listCourses,
  listTracks,
  setLessonProgress,
} from './curriculum/curriculum.service';
import { getDashboard } from './dashboard/dashboard.service';
import { getHealth } from './health/health.service';
import { createAttempt, getProblem, listProblems } from './practice/practice.service';
import { getQuiz, submitQuiz } from './quizzes/quiz.service';
import {
  createPlanTask,
  deletePlanTask,
  getPlanOverview,
  getPlanWeekDetail,
  resetPlan,
  updatePlan,
  updatePlanTask,
} from './plan/plan.service';
import { getPreferences, updatePreferences } from './preferences/preferences.service';
import {
  getProject,
  listProjects,
  setProjectMilestone,
  startProject,
} from './projects/projects.service';
import { searchCatalog } from './search/search.service';
import {
  createStudySession,
  deleteStudySession,
  listStudySessions,
} from './study/study.service';

export function createApiRouter(ctx: AppContext): Router {
  const router = Router();

  registerRoute(router, api.getHealth, () => getHealth(ctx));

  registerRoute(router, api.listTracks, () => ({ tracks: listTracks(ctx) }));
  registerRoute(router, api.getTrack, ({ params }) => getTrack(ctx, params.slug));
  registerRoute(router, api.listCourses, ({ query }) => ({ courses: listCourses(ctx, query) }));
  registerRoute(router, api.getCourse, ({ params }) => getCourse(ctx, params.slug));
  registerRoute(router, api.getLesson, ({ params }) => getLesson(ctx, params.slug));
  registerRoute(router, api.setLessonProgress, ({ params, body }) =>
    setLessonProgress(ctx, params.slug, body.status),
  );

  registerRoute(router, api.listProblems, ({ query }) => listProblems(ctx, query));
  registerRoute(router, api.getProblem, ({ params }) => getProblem(ctx, params.slug));
  registerRoute(router, api.createAttempt, ({ params, body }) => createAttempt(ctx, params.slug, body));

  registerRoute(router, api.getQuiz, ({ params }) => getQuiz(ctx, params.slug));
  registerRoute(router, api.submitQuiz, ({ params, body }) => submitQuiz(ctx, params.slug, body));

  registerRoute(router, api.getPreferences, () => getPreferences(ctx));
  registerRoute(router, api.updatePreferences, ({ body }) => updatePreferences(ctx, body));

  registerRoute(router, api.getPlan, () => getPlanOverview(ctx));
  registerRoute(router, api.updatePlan, ({ body }) => updatePlan(ctx, body));
  registerRoute(router, api.resetPlan, () => resetPlan(ctx));
  registerRoute(router, api.getPlanWeek, ({ params }) => getPlanWeekDetail(ctx, params.week));
  registerRoute(router, api.createPlanTask, ({ body }) => createPlanTask(ctx, body));
  registerRoute(router, api.updatePlanTask, ({ params, body }) =>
    updatePlanTask(ctx, params.id, body),
  );
  registerRoute(router, api.deletePlanTask, ({ params }) => {
    deletePlanTask(ctx, params.id);
    return undefined;
  });

  registerRoute(router, api.createStudySession, ({ body }) => createStudySession(ctx, body));
  registerRoute(router, api.listStudySessions, ({ query }) => ({
    sessions: listStudySessions(ctx, query),
  }));
  registerRoute(router, api.deleteStudySession, ({ params }) => {
    deleteStudySession(ctx, params.id);
    return undefined;
  });

  registerRoute(router, api.getDashboard, () => getDashboard(ctx));
  registerRoute(router, api.getCalendarMonth, ({ query }) => getCalendarMonth(ctx, query.month));
  registerRoute(router, api.searchCatalog, ({ query }) => searchCatalog(ctx, query.q, query.limit));

  registerRoute(router, api.listProjects, () => ({ projects: listProjects(ctx) }));
  registerRoute(router, api.getProject, ({ params }) => getProject(ctx, params.slug));
  registerRoute(router, api.startProject, ({ params }) => startProject(ctx, params.slug));
  registerRoute(router, api.setProjectMilestone, ({ params, body }) =>
    setProjectMilestone(ctx, params.slug, params.milestoneId, body.completed),
  );

  return router;
}
