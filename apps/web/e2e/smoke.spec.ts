import { expect, test } from '@playwright/test';
import { collectConsoleProblems, setPreferences } from './support';

test.describe('public pages and shell', () => {
  test.beforeEach(async ({ request }) => {
    await setPreferences(request, { locale: 'en', theme: 'light' });
  });

  test('landing page shows real catalog numbers and opens the dashboard', async ({ page }) => {
    const problems = collectConsoleProblems(page);
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Your personal developer academy for the AI era' }),
    ).toBeVisible();

    const stats = page.getByRole('term').filter({ hasText: 'learning tracks' });
    await expect(stats.locator('xpath=following-sibling::*[1]')).toHaveText('6');
    // Only written lessons are counted, so this is far smaller than the number of planned titles.
    const lessons = page.getByRole('term').filter({ hasText: 'lessons ready to study' });
    await expect(lessons.locator('xpath=following-sibling::*[1]')).toHaveText(/^\d+$/);

    await page.getByRole('link', { name: 'Open dashboard' }).first().click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Learner');
    expect(problems).toEqual([]);
  });

  test('first-time visitors get Hinglish before any preference is saved', async ({ browser, request }) => {
    await setPreferences(request, { locale: 'hi-Latn' });
    const context = await browser.newContext({ baseURL: 'http://localhost:5273' });
    const page = await context.newPage();
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'hi-Latn');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'AI ke daur ke liye aapki personal developer academy',
    );
    await context.close();
  });

  test('unknown URLs show the 404 page inside the app shell', async ({ page }) => {
    await page.goto('/definitely/not/a/page');

    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to the dashboard' })).toBeVisible();
    await expect(page).toHaveTitle('Page not found · Developer Learning OS');
  });

  test('planned features say so instead of showing fake screens', async ({ page }) => {
    await page.goto('/analytics');

    await expect(page.getByText('Planned for phase 6')).toBeVisible();
    await expect(page.getByText('Not built yet')).toBeVisible();
  });

  test('deep links survive a full page reload', async ({ page }) => {
    await page.goto('/courses?track=dsa');
    await expect(page.getByRole('heading', { level: 1, name: 'Courses' })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/track=dsa/);
    await expect(page.getByRole('heading', { level: 1, name: 'Courses' })).toBeVisible();
  });

  test('keyboard users can skip to the main content', async ({ page }) => {
    await page.goto('/dashboard');
    // The interface switches from the Hinglish default to the stored language once preferences arrive.
    // Pressing Tab before that would move focus on a tree that is about to be replaced.
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});
