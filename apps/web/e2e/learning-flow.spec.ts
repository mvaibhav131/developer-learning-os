import { expect, test } from '@playwright/test';
import { getDashboard, setPreferences } from './support';

// These flows write to the e2e database, so they run in order and compare before/after values
// instead of assuming a pristine state.
test.describe.configure({ mode: 'serial' });

test.describe('core learning flows', () => {
  test.beforeEach(async ({ request }) => {
    await setPreferences(request, { locale: 'en', theme: 'light' });
  });

  test('logging study time updates the dashboard from the database', async ({ page, request }) => {
    const before = await getDashboard(request);
    await page.goto('/dashboard');

    await page.getByRole('button', { name: 'Log study time' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Log study time' });
    await dialog.getByLabel('Minutes').fill('40');
    await dialog.getByLabel('Notes (optional)').fill('E2E: tokenization notes');
    await dialog.getByRole('button', { name: 'Log session' }).click();
    await expect(dialog).toBeHidden();

    const expected = before.daily.studiedMinutes + 40;
    await expect(page.getByText(`${expected} of ${before.daily.targetMinutes} min`)).toBeVisible();
    const after = await getDashboard(request);
    expect(after.daily.studiedMinutes).toBe(expected);
    expect(after.streak.current).toBeGreaterThanOrEqual(1);
  });

  test('completing a plan task is persisted and counted in plan progress', async ({ page, request }) => {
    const before = await getDashboard(request);
    const task = before.todayTasks.find((candidate) => !candidate.completedAt);
    test.skip(!task, 'every task of today is already done');
    if (!task) return;

    await page.goto('/dashboard');
    const checkbox = page.getByRole('checkbox', { name: `Mark "${task.title}" as done` });
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    await expect.poll(async () => (await getDashboard(request)).plan.overall.coreCompleted).toBe(
      before.plan.overall.coreCompleted + 1,
    );

    await page.reload();
    await expect(page.getByRole('checkbox', { name: `Mark "${task.title}" as done` })).toBeChecked();
  });

  test('a custom roadmap task can be added, edited and deleted', async ({ page }) => {
    await page.goto('/roadmap');
    await page.getByRole('button', { name: 'Add task' }).click();

    const dialog = page.getByRole('dialog', { name: 'Add a custom task' });
    await dialog.getByLabel('Title').fill('E2E custom revision');
    await dialog.getByLabel('Planned minutes').fill('25');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Task added')).toBeVisible();
    await expect(page.getByText('E2E custom revision').first()).toBeVisible();

    const row = page.getByRole('listitem').filter({ hasText: 'E2E custom revision' }).last();
    await row.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete task' }).click();
    await page.getByRole('dialog', { name: 'Delete task' }).getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Task deleted')).toBeVisible();
    await expect(page.getByText('E2E custom revision')).toHaveCount(0);
  });

  test('AI lab milestones persist after a reload', async ({ page }) => {
    await page.goto('/projects/ts-llm-api-client');

    const start = page.getByRole('button', { name: 'Start this lab' });
    if (await start.isVisible()) await start.click();

    const first = page.getByRole('checkbox', { name: /Mark ".*" as done/ }).first();
    if (!(await first.isChecked())) await first.click();
    await expect(first).toBeChecked();

    await page.reload();
    await expect(page.getByRole('checkbox', { name: /Mark ".*" as done/ }).first()).toBeChecked();
    await expect(page.getByText('1 of 5 done').first()).toBeVisible();
  });

  test('language and theme choices persist across reloads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();

    await page.locator('label', { hasText: 'Hindi (Devanagari)' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'सेटिंग्स' })).toBeVisible();

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await expect(page.getByRole('heading', { level: 1, name: 'सेटिंग्स' })).toBeVisible();

    await page.locator('label', { hasText: 'हिंग्लिश' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Preferences aapke local database me save hoti hain.')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi-Latn');
  });

  test('dark theme is applied immediately and survives a reload without a flash', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('label', { hasText: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('global search finds courses and jumps to them with the keyboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Control+k');

    const search = page.getByRole('combobox');
    await expect(search).toBeVisible();
    await search.fill('redis');
    const option = page.getByRole('option').first();
    await expect(option).toBeVisible();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/(courses|lessons|learn)\//);
  });

  test('the course catalog filters by track and text', async ({ page }) => {
    await page.goto('/courses');
    await page.getByRole('searchbox', { name: 'Filter courses' }).fill('rag');
    await expect(page).toHaveURL(/q=rag/);
    const links = page.getByRole('link', { name: /RAG/i });
    await expect(links.first()).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page).not.toHaveURL(/q=rag/);
  });

  test('a lesson without written content is labelled as planned and cannot be completed', async ({
    page,
    request,
  }) => {
    const track = (await (await request.get('/api/v1/tracks/ai')).json()) as { courses: Array<{ slug: string }> };
    const course = (await (await request.get(`/api/v1/courses/${track.courses[0]?.slug ?? ''}`)).json()) as {
      modules: Array<{ lessons: Array<{ slug: string; title: string }> }>;
    };
    const lesson = course.modules[0]?.lessons[0];
    if (!lesson) throw new Error('The seeded catalog has no lessons');

    await page.goto(`/lessons/${lesson.slug}`);
    await expect(page.getByRole('heading', { level: 1, name: lesson.title })).toBeVisible();
    await expect(page.getByText('This lesson is not written yet')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark as complete' })).toHaveCount(0);
  });
});
