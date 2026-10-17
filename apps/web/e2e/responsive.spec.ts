import { expect, test, type Page } from '@playwright/test';
import { setPreferences, settle } from './support';

const WIDTHS = [320, 375, 390, 768, 1024, 1440] as const;
const ROUTES = [
  '/',
  '/dashboard',
  '/roadmap',
  '/calendar',
  '/learn',
  '/learn/ai',
  '/learn/english',
  '/courses',
  '/lessons/hashing-interview-patterns',
  '/lessons/en-sentence-structure',
  '/practice',
  '/practice/two-sum',
  '/projects',
  '/projects/ts-llm-api-client',
  '/settings',
  '/analytics',
  '/not-a-real-page',
] as const;

async function expectNoHorizontalScroll(page: Page, label: string): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `${label} scrolls horizontally`).toBeLessThanOrEqual(clientWidth);
}

test.describe('responsive layout', () => {
  test.beforeEach(async ({ request }) => {
    await setPreferences(request, { locale: 'en', theme: 'light' });
  });

  for (const width of WIDTHS) {
    test(`no page scrolls horizontally at ${width}px`, async ({ page }) => {
      test.setTimeout(150_000);
      await page.setViewportSize({ width, height: 900 });
      for (const route of ROUTES) {
        await page.goto(route);
        await settle(page);
        await expectNoHorizontalScroll(page, `${route} at ${width}px`);
      }
    });
  }

  test('phones get a bottom navigation and a drawer menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/dashboard');

    const bottom = page.getByRole('navigation', { name: 'Primary navigation' });
    await expect(bottom).toBeVisible();
    await expect(bottom.getByRole('link', { name: 'Practice' })).toBeVisible();

    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const drawer = page.getByRole('dialog');
    await expect(drawer.getByRole('link', { name: 'DSA practice' })).toBeVisible();
    await drawer.getByRole('link', { name: 'DSA practice' }).click();
    await expect(page).toHaveURL(/\/practice$/);
    await expect(drawer).toBeHidden();
  });

  test('tablets use the drawer while desktops keep the sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 900 });
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toHaveCount(0);

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden();
  });

  test('the collapsed desktop sidebar keeps accessible link names', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();

    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    await expect(nav.getByRole('link', { name: 'Roadmap' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  });
});
