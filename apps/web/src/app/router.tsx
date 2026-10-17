import { createBrowserRouter, type RouteObject } from 'react-router';
import { PLANNED_ROUTES } from './navigation';
import { AppLoading } from '../components/app-loading';
import { AppShell } from '../components/layout/app-shell';
import { RouteError } from '../features/not-found/route-error';

const plannedRoutes: RouteObject[] = PLANNED_ROUTES.map((route) => ({
  path: route.path,
  lazy: async () => {
    const { PlannedPage } = await import('../features/planned/planned-page');
    return {
      Component: () => <PlannedPage feature={route.feature} phase={route.phase} titleKey={route.titleKey} />,
    };
  },
}));

export const routes: RouteObject[] = [
  {
    path: '/',
    lazy: () => import('../features/landing/landing-page'),
    HydrateFallback: AppLoading,
    errorElement: <RouteError />,
  },
  {
    element: <AppShell />,
    HydrateFallback: AppLoading,
    errorElement: <RouteError />,
    children: [
      { path: 'dashboard', lazy: () => import('../features/dashboard/dashboard-page') },
      { path: 'roadmap', lazy: () => import('../features/roadmap/roadmap-page') },
      { path: 'calendar', lazy: () => import('../features/calendar/calendar-page') },
      { path: 'learn', lazy: () => import('../features/learn/learn-page') },
      { path: 'learn/:track', lazy: () => import('../features/learn/track-page') },
      { path: 'courses', lazy: () => import('../features/courses/courses-page') },
      { path: 'courses/:slug', lazy: () => import('../features/courses/course-page') },
      { path: 'lessons/:slug', lazy: () => import('../features/courses/lesson-page') },
      { path: 'projects', lazy: () => import('../features/projects/projects-page') },
      { path: 'projects/:slug', lazy: () => import('../features/projects/project-page') },
      { path: 'practice', lazy: () => import('../features/practice/practice-page') },
      { path: 'practice/:slug', lazy: () => import('../features/practice/problem-page') },
      { path: 'settings', lazy: () => import('../features/settings/settings-page') },
      ...plannedRoutes,
      { path: '*', lazy: () => import('../features/not-found/not-found-page') },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
