import type { APIRequestContext, Page } from '@playwright/test';

export const ORIGIN = 'http://localhost:5273';

interface Dashboard {
  today: string;
  daily: { studiedMinutes: number; targetMinutes: number };
  plan: { overall: { coreCompleted: number; coreTasks: number } };
  todayTasks: Array<{ id: number; title: string; completedAt: string | null }>;
  streak: { current: number };
}

/** Pins the stored preferences so UI assertions do not depend on the default language. */
export async function setPreferences(
  request: APIRequestContext,
  preferences: { locale?: 'hi-Latn' | 'en' | 'hi'; theme?: 'system' | 'light' | 'dark' },
): Promise<void> {
  const response = await request.patch(`${ORIGIN}/api/v1/preferences`, {
    headers: { Origin: ORIGIN },
    data: preferences,
  });
  if (!response.ok()) throw new Error(`Could not set preferences: ${response.status()}`);
}

export async function getDashboard(request: APIRequestContext): Promise<Dashboard> {
  const response = await request.get(`${ORIGIN}/api/v1/dashboard`);
  if (!response.ok()) throw new Error(`Could not load the dashboard: ${response.status()}`);
  return (await response.json()) as Dashboard;
}

/** Resolves once the app shell and the first route chunk have rendered. */
export async function waitForApp(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Waits for the network to go quiet, but gives up after a few seconds. Lesson pages show video thumbnails from
 * YouTube, and a slow or blocked third-party image must not fail a layout or accessibility check.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
}

export function collectConsoleProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}
