import { expect, test } from '@playwright/test';
import { setPreferences } from './support';

// These flows write to the e2e database, so they run in order and never assume a pristine state.
test.describe.configure({ mode: 'serial' });

const TWO_SUM = `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const j = seen.get(target - nums[i]);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i);
  }
  return [];
}`;

test.describe('lessons, videos, quizzes and practice live inside the app', () => {
  test.beforeEach(async ({ request }) => {
    await setPreferences(request, { locale: 'en', theme: 'light' });
  });

  test('an English lesson plays its video on the page, has speaking practice and can be downloaded', async ({
    page,
  }) => {
    await page.goto('/lessons/en-sentence-structure');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Sentence structure: subject, verb, object' }),
    ).toBeVisible();

    // The video never leaves the page: a click swaps the thumbnail for a privacy-friendly embed.
    expect(await page.locator('iframe').count()).toBe(0);
    await page.getByRole('button', { name: /English Sentence Structure/ }).first().click();
    await expect(page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/"]').first()).toBeVisible();

    // Practice phrases can be copied, and listened to when the browser has a voice.
    await expect(page.getByText('Practice phrases').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy "I fixed the bug yesterday."' })).toBeVisible();

    // Notes download as a Markdown file.
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).first().click();
    await page.getByRole('menuitem', { name: 'Notes as Markdown (.md)' }).click();
    expect((await downloading).suggestedFilename()).toMatch(/\.md$/);
  });

  test('completing a lesson is saved and survives a reload', async ({ page, request }) => {
    await page.goto('/lessons/en-sentence-structure');
    await page.getByRole('button', { name: 'Mark as complete' }).first().click();
    await expect(page.getByRole('button', { name: 'Mark as not done' }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Mark as not done' }).first()).toBeVisible();

    const saved = (await (await request.get('http://localhost:5273/api/v1/lessons/en-sentence-structure')).json()) as {
      lesson: { progress: string; completedAt: string | null };
    };
    expect(saved.lesson.progress).toBe('completed');
    expect(saved.lesson.completedAt).toBeTruthy();
  });

  test('a quiz is graded by the server and explains the answers', async ({ page }) => {
    await page.goto('/lessons/en-sentence-structure');
    await page.getByRole('button', { name: 'Start quiz' }).click();

    await page.getByRole('radio', { name: 'I drink tea every day.' }).check();
    await page.getByRole('radio', { name: 'The server is slow today.' }).check();
    await page.getByRole('checkbox', { name: 'We review pull requests every morning.' }).check();
    await page.getByRole('checkbox', { name: 'Yesterday, I deployed the fix to production.' }).check();
    await page.getByRole('radio', { name: 'False' }).check();
    await page.getByRole('button', { name: 'Check answers' }).click();

    await expect(page.getByText('4 of 4 correct')).toBeVisible();
    await expect(page.getByText(/Well done, you passed/)).toBeVisible();
    await expect(page.getByText('Hindi is Subject-Object-Verb.', { exact: false })).toBeVisible();
  });

  test('the DSA foundations lesson links to problems you can solve in the editor', async ({ page }) => {
    await page.goto('/lessons/hashing-interview-patterns');
    await expect(page.getByRole('heading', { name: 'Practice this' })).toBeVisible();
    await page.getByRole('link', { name: /Two Sum/ }).first().click();
    await expect(page).toHaveURL(/\/practice\/two-sum$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Two Sum' })).toBeVisible();
  });

  test('a problem is solved in the built-in editor and stays solved', async ({ page }) => {
    await page.goto('/practice/two-sum');
    await expect(page.getByRole('heading', { level: 1, name: 'Two Sum' })).toBeVisible();

    const editor = page.getByRole('textbox', { name: 'Code editor' });
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText(TWO_SUM);

    // The starter code fails, a correct solution passes the examples and then every hidden test.
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByText('3 of 3 tests passed')).toBeVisible();

    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByText('7 of 7 tests passed')).toBeVisible();
    await expect(page.getByText('Problem solved').first()).toBeVisible();

    await page.goto('/practice');
    const row = page.getByRole('link').filter({ hasText: 'Two Sum' }).filter({ hasNotText: 'Two Sum II' });
    await expect(row.getByRole('img', { name: 'Solved' })).toBeVisible();
  });

  test('wrong code shows the failing input, the expected value and what the code returned', async ({ page }) => {
    await page.goto('/practice/valid-anagram');
    const editor = page.getByRole('textbox', { name: 'Code editor' });
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText('function isAnagram(s, t) { return true; }');
    await page.getByRole('button', { name: 'Run', exact: true }).click();

    const results = page.getByRole('region', { name: 'Test results' });
    await expect(results.getByText('2 of 3 tests passed')).toBeVisible();
    // The first failing test opens by itself and shows what went in, what was expected and what came out.
    const failing = results.locator('details[open]');
    await expect(failing.getByText('Input')).toBeVisible();
    await expect(failing.getByText('Expected')).toBeVisible();
    await expect(failing.getByText('Output')).toBeVisible();
  });

  test('the practice list filters by difficulty and the search finds problems', async ({ page }) => {
    await page.goto('/practice');
    await page.getByLabel('Difficulty').selectOption('hard');
    await expect(page.getByText('No problem matches these filters.')).toBeVisible();
    await page.getByLabel('Difficulty').selectOption('easy');
    await expect(page.getByRole('link', { name: /Fizz Buzz/ })).toBeVisible();

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox').fill('two sum');
    await page.getByRole('option', { name: /Two Sum(?! II)/ }).first().click();
    await expect(page).toHaveURL(/\/practice\/two-sum$/);
  });

  test('the English track lists its courses, and its lessons are self-paced', async ({ page }) => {
    await page.goto('/learn/english');
    await expect(page.getByRole('heading', { level: 1, name: 'English for Developers' })).toBeVisible();
    await expect(page.getByText('English Grammar Foundations').first()).toBeVisible();
    await expect(page.getByText('Interview English').first()).toBeVisible();
  });
});
