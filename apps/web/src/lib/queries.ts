import {
  keepPreviousData,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as api from '@dlos/shared';
import { ApiError, callApi } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 2,
    },
    mutations: { retry: false },
  },
});

export const keys = {
  health: ['health'] as const,
  tracks: ['tracks'] as const,
  track: (slug: string) => ['tracks', slug] as const,
  courses: (filters: object) => ['courses', filters] as const,
  course: (slug: string) => ['course', slug] as const,
  lesson: (slug: string) => ['lesson', slug] as const,
  preferences: ['preferences'] as const,
  plan: ['plan'] as const,
  planWeek: (week: number) => ['plan', 'week', week] as const,
  dashboard: ['dashboard'] as const,
  calendar: (month: string) => ['calendar', month] as const,
  sessions: (filters: object) => ['sessions', filters] as const,
  search: (q: string) => ['search', q] as const,
  projects: ['projects'] as const,
  project: (slug: string) => ['project', slug] as const,
  problems: (filters: object) => ['problems', filters] as const,
  problem: (slug: string) => ['problem', slug] as const,
  quiz: (slug: string) => ['quiz', slug] as const,
};

// ---- read hooks -----------------------------------------------------------------------------

export const useHealth = () =>
  useQuery({
    queryKey: keys.health,
    queryFn: ({ signal }) => callApi(api.getHealth, undefined, { signal }),
  });

export const useTracks = () =>
  useQuery({
    queryKey: keys.tracks,
    queryFn: ({ signal }) => callApi(api.listTracks, undefined, { signal }),
  });

export const useTrack = (slug: string) =>
  useQuery({
    queryKey: keys.track(slug),
    queryFn: ({ signal }) => callApi(api.getTrack, { params: { slug } }, { signal }),
  });

export interface CourseFilters {
  track?: api.TrackSlug | undefined;
  difficulty?: api.Difficulty | undefined;
  q?: string | undefined;
}

export const useCourses = (filters: CourseFilters) =>
  useQuery({
    queryKey: keys.courses(filters),
    queryFn: ({ signal }) => callApi(api.listCourses, { query: filters }, { signal }),
    placeholderData: keepPreviousData,
  });

export const useCourse = (slug: string) =>
  useQuery({
    queryKey: keys.course(slug),
    queryFn: ({ signal }) => callApi(api.getCourse, { params: { slug } }, { signal }),
  });

export const useLesson = (slug: string) =>
  useQuery({
    queryKey: keys.lesson(slug),
    queryFn: ({ signal }) => callApi(api.getLesson, { params: { slug } }, { signal }),
  });

export const usePreferences = () =>
  useQuery({
    queryKey: keys.preferences,
    queryFn: ({ signal }) => callApi(api.getPreferences, undefined, { signal }),
  });

export const usePlan = () =>
  useQuery({
    queryKey: keys.plan,
    queryFn: ({ signal }) => callApi(api.getPlan, undefined, { signal }),
  });

export const usePlanWeek = (week: number, enabled = true) =>
  useQuery({
    queryKey: keys.planWeek(week),
    queryFn: ({ signal }) => callApi(api.getPlanWeek, { params: { week } }, { signal }),
    enabled,
  });

export const useDashboard = () =>
  useQuery({
    queryKey: keys.dashboard,
    queryFn: ({ signal }) => callApi(api.getDashboard, undefined, { signal }),
  });

export const useCalendar = (month?: string) =>
  useQuery({
    queryKey: keys.calendar(month ?? 'current'),
    queryFn: ({ signal }) =>
      callApi(api.getCalendarMonth, { query: month ? { month } : {} }, { signal }),
    placeholderData: keepPreviousData,
  });

export const useStudySessions = (filters: { from?: string; to?: string; limit?: number }) =>
  useQuery({
    queryKey: keys.sessions(filters),
    queryFn: ({ signal }) => callApi(api.listStudySessions, { query: filters }, { signal }),
  });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: keys.search(q),
    queryFn: ({ signal }) => callApi(api.searchCatalog, { query: { q, limit: 12 } }, { signal }),
    enabled: q.trim().length >= 2,
    staleTime: 60_000,
  });

export const useProjects = () =>
  useQuery({
    queryKey: keys.projects,
    queryFn: ({ signal }) => callApi(api.listProjects, undefined, { signal }),
  });

export const useProject = (slug: string) =>
  useQuery({
    queryKey: keys.project(slug),
    queryFn: ({ signal }) => callApi(api.getProject, { params: { slug } }, { signal }),
  });

export interface ProblemFilters {
  topic?: string | undefined;
  difficulty?: api.ProblemDifficulty | undefined;
  status?: api.ProblemStatus | undefined;
  q?: string | undefined;
}

export const useProblems = (filters: ProblemFilters) =>
  useQuery({
    queryKey: keys.problems(filters),
    queryFn: ({ signal }) => callApi(api.listProblems, { query: filters }, { signal }),
    placeholderData: keepPreviousData,
  });

export const useProblem = (slug: string) =>
  useQuery({
    queryKey: keys.problem(slug),
    queryFn: ({ signal }) => callApi(api.getProblem, { params: { slug } }, { signal }),
  });

// ---- mutations ------------------------------------------------------------------------------

function useInvalidatePlanData() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['plan'] }),
      client.invalidateQueries({ queryKey: keys.dashboard }),
      client.invalidateQueries({ queryKey: ['calendar'] }),
    ]);
}

export function useUpdatePreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: api.UpdatePreferences) => callApi(api.updatePreferences, { body }),
    onSuccess: (data) => {
      client.setQueryData(keys.preferences, data);
      void client.invalidateQueries({ queryKey: keys.dashboard });
      void client.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUpdatePlan() {
  const invalidate = useInvalidatePlanData();
  return useMutation({
    mutationFn: (body: { name?: string; startDate?: string }) =>
      callApi(api.updatePlan, { body }),
    onSuccess: invalidate,
  });
}

export function useResetPlan() {
  const invalidate = useInvalidatePlanData();
  return useMutation({
    mutationFn: () => callApi(api.resetPlan, { body: { confirm: true } }),
    onSuccess: invalidate,
  });
}

export function useCreatePlanTask() {
  const invalidate = useInvalidatePlanData();
  return useMutation({
    mutationFn: (body: api.CreatePlanTask) => callApi(api.createPlanTask, { body }),
    onSuccess: invalidate,
  });
}

export function useUpdatePlanTask() {
  const invalidate = useInvalidatePlanData();
  return useMutation({
    mutationFn: ({ id, ...body }: api.UpdatePlanTask & { id: number }) =>
      callApi(api.updatePlanTask, { params: { id }, body }),
    onSuccess: invalidate,
  });
}

export function useDeletePlanTask() {
  const invalidate = useInvalidatePlanData();
  return useMutation({
    mutationFn: (id: number) => callApi(api.deletePlanTask, { params: { id } }),
    onSuccess: invalidate,
  });
}

export function useCreateStudySession() {
  const invalidate = useInvalidatePlanData();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: api.CreateStudySession) => callApi(api.createStudySession, { body }),
    onSuccess: async () => {
      await invalidate();
      await client.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useDeleteStudySession() {
  const invalidate = useInvalidatePlanData();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => callApi(api.deleteStudySession, { params: { id } }),
    onSuccess: async () => {
      await invalidate();
      await client.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useSetLessonProgress() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { slug: string; status: api.ProgressStatus }) =>
      callApi(api.setLessonProgress, { params: { slug: input.slug }, body: { status: input.status } }),
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: keys.lesson(input.slug) });
      void client.invalidateQueries({ queryKey: ['course'] });
      void client.invalidateQueries({ queryKey: ['tracks'] });
      void client.invalidateQueries({ queryKey: keys.dashboard });
      void client.invalidateQueries({ queryKey: ['plan'] });
    },
  });
}

export const useQuiz = (slug: string, enabled = true) =>
  useQuery({
    queryKey: keys.quiz(slug),
    queryFn: ({ signal }) => callApi(api.getQuiz, { params: { slug } }, { signal }),
    enabled,
    staleTime: Infinity,
  });

export function useSubmitQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { slug: string; body: api.SubmitQuiz }) =>
      callApi(api.submitQuiz, { params: { slug: input.slug }, body: input.body }),
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: keys.lesson(input.slug) });
    },
  });
}

export function useCreateAttempt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { slug: string; attempt: api.CreateAttempt }) =>
      callApi(api.createAttempt, { params: { slug: input.slug }, body: input.attempt }),
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: keys.problem(input.slug) });
      void client.invalidateQueries({ queryKey: ['problems'] });
      void client.invalidateQueries({ queryKey: ['lesson'] });
      void client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useStartProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => callApi(api.startProject, { params: { slug } }),
    onSuccess: (data) => {
      client.setQueryData(keys.project(data.project.slug), data);
      void client.invalidateQueries({ queryKey: keys.projects });
      void client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useSetMilestone() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { slug: string; milestoneId: number; completed: boolean }) =>
      callApi(api.setProjectMilestone, {
        params: { slug: input.slug, milestoneId: input.milestoneId },
        body: { completed: input.completed },
      }),
    onSuccess: (data) => {
      client.setQueryData(keys.project(data.project.slug), data);
      void client.invalidateQueries({ queryKey: keys.projects });
      void client.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}
