// Checks a running instance: local Docker, a staging server or a deployed site.
//   node scripts/smoke.mjs http://localhost:8080
//   BASIC_AUTH=owner:your-passphrase node scripts/smoke.mjs https://learn.example.com
// It reads data and writes one harmless setting (the theme) and restores it, so it is safe to run on your own data.

const base = (process.argv[2] ?? process.env.BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const credentials = process.env.BASIC_AUTH;
const headers = credentials ? { Authorization: `Basic ${Buffer.from(credentials).toString('base64')}` } : {};

let failed = 0;

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function check(name, run) {
  try {
    const detail = await run();
    console.log(`ok    ${name}${detail ? ` (${detail})` : ''}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL  ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const request = (path, init = {}) => fetch(`${base}${path}`, { ...init, headers: { ...headers, ...init.headers } });
const json = async (path, init) => {
  const response = await request(path, init);
  expect(response.ok, `${path} answered ${response.status}`);
  return response.json();
};

await check('health answers and reports the content', async () => {
  const response = await fetch(`${base}/api/v1/health`);
  expect(response.ok, `status ${response.status}`);
  const body = await response.json();
  expect(body.status === 'ok', `status is "${body.status}"`);
  expect(body.database.status === 'ok', 'the database is not ok');
  return `${body.content.lessonsWithContent} lessons with content`;
});

await check('the home page is the web app', async () => {
  const response = await request('/');
  const html = await response.text();
  expect(response.ok, `status ${response.status}`);
  expect(html.includes('id="root"'), 'the page has no #root element');
  const policy = response.headers.get('content-security-policy') ?? '';
  expect(policy.includes('frame-src https://www.youtube-nocookie.com'), 'the content security policy does not allow YouTube embeds');
});

await check('deep links fall back to the web app', async () => {
  const response = await request('/lessons/big-o-analysis');
  expect(response.ok && (await response.text()).includes('id="root"'), `status ${response.status}`);
});

await check('written lessons come with videos and a quiz', async () => {
  const detail = await json('/api/v1/lessons/big-o-analysis');
  expect(detail.lesson.contentStatus === 'complete', `status is ${detail.lesson.contentStatus}`);
  expect(detail.content.bodyMarkdown.length > 1500, 'the lesson body is too short');
  expect(detail.videos.length > 0, 'the lesson has no videos');
  expect(detail.quiz !== null, 'the lesson has no quiz');
  return `${detail.videos.length} videos`;
});

await check('the English track exists with written lessons', async () => {
  const { tracks } = await json('/api/v1/tracks');
  const english = tracks.find((track) => track.slug === 'english');
  expect(english, 'there is no english track');
  expect(english.stats.completeLessonCount > 0, 'no English lesson is written');
  return `${english.stats.completeLessonCount} of ${english.stats.lessonCount} lessons written`;
});

await check('practice problems are available', async () => {
  const list = await json('/api/v1/practice/problems');
  expect(list.summary.total >= 30, `only ${list.summary.total} problems`);
  const problem = await json('/api/v1/practice/problems/two-sum');
  expect(problem.problem.tests.length >= 5, 'two-sum has too few tests');
  return `${list.summary.total} problems`;
});

await check('changes are saved (and the origin check accepts this address)', async () => {
  const before = await json('/api/v1/preferences');
  const next = before.theme === 'dark' ? 'light' : 'dark';
  const send = (theme) =>
    request('/api/v1/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Origin: new URL(base).origin },
      body: JSON.stringify({ theme }),
    });
  const changed = await send(next);
  expect(changed.ok, `PATCH answered ${changed.status}. Is PUBLIC_URL set to ${base}?`);
  expect((await json('/api/v1/preferences')).theme === next, 'the new value was not stored');
  await send(before.theme);
});

if (failed > 0) {
  console.log(`\n${failed} check(s) failed for ${base}`);
  process.exit(1);
}
console.log(`\nAll checks passed for ${base}`);
