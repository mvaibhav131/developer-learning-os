import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { setPreferences, settle } from './support';

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

const THEMES = ['light', 'dark'] as const;
const LOCALES = ['en', 'hi-Latn', 'hi'] as const;

async function audit(page: import('@playwright/test').Page, label: string) {
  await settle(page);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const summary = blocking.map(
    (violation) =>
      `${violation.id} (${violation.impact}) x${violation.nodes.length}: ${violation.nodes
        .slice(0, 2)
        .map((node) => node.target.join(' '))
        .join(' | ')}`,
  );
  expect(summary, `${label}: serious or critical accessibility violations`).toEqual([]);
}

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  for (const theme of THEMES) {
    for (const route of ROUTES) {
      test(`${route} passes in the ${theme} theme`, async ({ page, request }) => {
        await setPreferences(request, { locale: 'en', theme });
        await page.goto(route);
        await audit(page, `${route} (${theme})`);
      });
    }
  }

  for (const locale of LOCALES) {
    test(`dashboard and settings pass in ${locale}`, async ({ page, request }) => {
      await setPreferences(request, { locale, theme: 'light' });
      for (const route of ['/dashboard', '/settings']) {
        await page.goto(route);
        await audit(page, `${route} (${locale})`);
      }
    });
  }

  test('dialogs and menus are accessible', async ({ page, request }) => {
    await setPreferences(request, { locale: 'en', theme: 'light' });
    await page.goto('/dashboard');

    await page.getByRole('button', { name: 'Log study time' }).first().click();
    await expect(page.getByRole('dialog', { name: 'Log study time' })).toBeVisible();
    await audit(page, 'log study dialog');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, 'command palette');
  });
});
