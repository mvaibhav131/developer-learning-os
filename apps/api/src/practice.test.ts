import { loadProblemFiles, stripTypes } from '@dlos/learning-content';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test/helpers';

const problems = loadProblemFiles();
const twoSum = problems.find((problem) => problem.slug === 'two-sum');

let t: TestApp;
beforeEach(() => {
  t = createTestApp();
});
afterEach(() => {
  t.close();
});

function attempt(overrides: Record<string, unknown> = {}) {
  const problem = twoSum;
  if (!problem) throw new Error('two-sum problem is required for these tests');
  return {
    language: 'typescript',
    kind: 'submit',
    code: problem.solution.code,
    status: 'passed',
    passedCount: problem.tests.length,
    totalCount: problem.tests.length,
    runtimeMs: 3,
    ...overrides,
  };
}

describe('practice problems', () => {
  it('lists every authored problem with unsolved status and overall counts', async () => {
    const res = await t.request.get('/api/v1/practice/problems').expect(200);
    expect(res.body.problems).toHaveLength(problems.length);
    expect(res.body.summary).toMatchObject({ total: problems.length, solved: 0, attempted: 0 });
    expect(res.body.problems.every((problem: { status: string }) => problem.status === 'unsolved')).toBe(true);
    expect(res.body.topics).toContain('hash-map');

    const easy = await t.request.get('/api/v1/practice/problems?difficulty=easy').expect(200);
    expect(easy.body.problems.every((problem: { difficulty: string }) => problem.difficulty === 'easy')).toBe(true);
    expect(easy.body.summary.total).toBe(problems.length);

    const search = await t.request.get('/api/v1/practice/problems?q=anagram').expect(200);
    expect(search.body.problems.map((problem: { slug: string }) => problem.slug)).toEqual(
      expect.arrayContaining(['valid-anagram', 'group-anagrams']),
    );
    const topic = await t.request.get('/api/v1/practice/problems?topic=Hash-Map').expect(200);
    expect(topic.body.problems.length).toBeGreaterThan(0);
  });

  it('returns the full problem with starters in both languages, tests, hints and the solution', async () => {
    const res = await t.request.get('/api/v1/practice/problems/two-sum').expect(200);
    const { problem } = res.body;
    expect(problem).toMatchObject({ slug: 'two-sum', difficulty: 'easy', functionName: 'twoSum', status: 'unsolved' });
    expect(problem.starterCode.typescript).toContain('twoSum(nums: number[]');
    expect(problem.starterCode.javascript).not.toContain(': number[]');
    expect(problem.starterCode.javascript).toBe(stripTypes(problem.starterCode.typescript));
    expect(problem.tests.some((test: { hidden?: boolean }) => test.hidden)).toBe(true);
    expect(problem.hints.length).toBeGreaterThanOrEqual(1);
    expect(problem.solution).toMatchObject({ timeComplexity: 'O(n)', spaceComplexity: 'O(n)' });
    expect(problem.videos[0]).toMatchObject({ id: 'KLlXCFG5TnA' });
    expect(res.body.lesson).toMatchObject({ slug: 'hashing-interview-patterns' });
    expect(res.body.latestCode).toBeNull();
    expect(res.body.recentAttempts).toEqual([]);
    expect(problem.harness).toEqual({ ordering: 'any-order' });
    await t.request.get('/api/v1/practice/problems/nope').expect(404);
  });

  it('records attempts, solves a problem once and reflects it everywhere', async () => {
    const failed = await t.request
      .post('/api/v1/practice/problems/two-sum/attempts')
      .send(attempt({ status: 'partial', passedCount: 2, code: 'function twoSum() { return []; }' }))
      .expect(201);
    expect(failed.body).toMatchObject({ problemStatus: 'attempted', firstSolve: false });

    const list = await t.request.get('/api/v1/practice/problems').expect(200);
    expect(list.body.summary).toMatchObject({ solved: 0, attempted: 1 });

    const solved = await t.request.post('/api/v1/practice/problems/two-sum/attempts').send(attempt()).expect(201);
    expect(solved.body).toMatchObject({ problemStatus: 'solved', firstSolve: true });
    expect(solved.body.attempt).toMatchObject({ kind: 'submit', status: 'passed' });

    const again = await t.request.post('/api/v1/practice/problems/two-sum/attempts').send(attempt()).expect(201);
    expect(again.body).toMatchObject({ problemStatus: 'solved', firstSolve: false });

    const detail = await t.request.get('/api/v1/practice/problems/two-sum').expect(200);
    expect(detail.body.problem.status).toBe('solved');
    expect(detail.body.problem.attempts).toBe(3);
    expect(detail.body.latestCode).toMatchObject({ language: 'typescript' });
    expect(detail.body.recentAttempts).toHaveLength(3);
    expect(detail.body.next.slug).not.toBe('two-sum');

    const dashboard = await t.request.get('/api/v1/dashboard').expect(200);
    expect(dashboard.body.practice).toMatchObject({ total: problems.length, solved: 1, attempted: 0 });
    const events = dashboard.body.recentActivity.filter((event: { type: string }) => event.type === 'problem_solved');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ title: 'Two Sum', trackSlug: 'dsa' });

    const search = await t.request.get('/api/v1/search?q=two%20sum').expect(200);
    expect(search.body.results[0]).toMatchObject({ type: 'problem', slug: 'two-sum' });
  });

  it('does not count a run, or a failed submission, as solving', async () => {
    const run = await t.request
      .post('/api/v1/practice/problems/two-sum/attempts')
      .send(attempt({ kind: 'run', totalCount: 3, passedCount: 3 }))
      .expect(201);
    expect(run.body).toMatchObject({ problemStatus: 'attempted', firstSolve: false });
    const failed = await t.request
      .post('/api/v1/practice/problems/two-sum/attempts')
      .send(attempt({ status: 'failed', passedCount: 0 }))
      .expect(201);
    expect(failed.body.problemStatus).toBe('attempted');
  });

  it('validates attempts', async () => {
    const url = '/api/v1/practice/problems/two-sum/attempts';
    const total = twoSum?.tests.length ?? 0;
    await t.request.post(url).send(attempt({ totalCount: total - 1, passedCount: total - 1 })).expect(422);
    await t.request.post(url).send(attempt({ status: 'passed', passedCount: total - 1 })).expect(422);
    await t.request.post(url).send(attempt({ passedCount: total + 1 })).expect(422);
    await t.request.post(url).send(attempt({ totalCount: total + 5, passedCount: total + 5, kind: 'run' })).expect(422);
    await t.request.post(url).send(attempt({ language: 'python' })).expect(400);
    await t.request.post(url).send(attempt({ code: '' })).expect(400);
    await t.request.post(url).send({ ...attempt(), extra: true }).expect(400);
    await t.request.post('/api/v1/practice/problems/nope/attempts').send(attempt()).expect(404);
  });

  it('keeps accepted submissions when pruning old attempts', async () => {
    const url = '/api/v1/practice/problems/two-sum/attempts';
    await t.request.post(url).send(attempt()).expect(201);
    for (let index = 0; index < 35; index += 1) {
      await t.request.post(url).send(attempt({ kind: 'run', status: 'failed', passedCount: 0, totalCount: 3, code: `// try ${index}` })).expect(201);
    }
    const detail = await t.request.get('/api/v1/practice/problems/two-sum').expect(200);
    expect(detail.body.problem.status).toBe('solved');
    expect(detail.body.problem.attempts).toBe(31);
  });
});
