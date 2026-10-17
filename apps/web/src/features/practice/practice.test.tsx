import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { installFakeApi, jsonResponse } from '../../test/fake-api';
import {
  TWO_SUM_SOLUTION,
  makePreferences,
  makeProblemDetail,
  makeProblemList,
} from '../../test/fixtures';
import { renderApp } from '../../test/render';

// CodeMirror needs real layout, which jsdom does not have. The editor itself is covered in the browser.
vi.mock('./code-editor', async () => {
  const React = await import('react');
  return {
    CodeEditor: ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) =>
      React.createElement('textarea', {
        'aria-label': label,
        value,
        onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      }),
  };
});

const preferences = makePreferences({ locale: 'en', theme: 'light' });

function attemptResponse(firstSolve = false) {
  return ({ body }: { body: unknown }) =>
    jsonResponse(
      {
        attempt: {
          id: 1,
          language: 'typescript',
          kind: 'run',
          status: 'passed',
          passedCount: 2,
          totalCount: 2,
          runtimeMs: 1,
          createdAt: '2026-10-19T06:00:00.000Z',
          ...(body as object),
        },
        problemStatus: firstSolve ? 'solved' : 'attempted',
        firstSolve,
      },
      201,
    );
}

describe('practice list', () => {
  it('shows real progress and links every problem to the built-in editor', async () => {
    installFakeApi({ 'GET /preferences': preferences, 'GET /practice/problems': makeProblemList() });
    await renderApp('/practice');

    expect(await screen.findByText('1 of 2 solved')).toBeInTheDocument();
    const solved = screen.getByRole('link', { name: /Two Sum/ });
    expect(solved).toHaveAttribute('href', '/practice/two-sum');
    expect(within(solved).getByRole('img', { name: 'Solved' })).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: /Group Anagrams/ })).getByRole('img', { name: 'Not solved' })).toBeInTheDocument();
  });

  it('sends the chosen filters to the API', async () => {
    const api = installFakeApi({ 'GET /preferences': preferences, 'GET /practice/problems': makeProblemList() });
    const user = userEvent.setup();
    await renderApp('/practice');

    await screen.findByText('1 of 2 solved');
    await user.selectOptions(screen.getByLabelText('Difficulty'), 'easy');
    await user.selectOptions(screen.getByLabelText('Topic'), 'hash-map');

    await waitFor(() => {
      const last = api.callsTo('GET', '/practice/problems').at(-1);
      expect(last?.search).toContain('difficulty=easy');
      expect(last?.search).toContain('topic=hash-map');
    });
  });
});

describe('practice problem', () => {
  it('shows the statement, examples, hints and a solution that stays hidden until asked for', async () => {
    installFakeApi({ 'GET /preferences': preferences, 'GET /practice/problems/two-sum': makeProblemDetail() });
    const user = userEvent.setup();
    await renderApp('/practice/two-sum');

    expect(await screen.findByRole('heading', { level: 1, name: 'Two Sum' })).toBeInTheDocument();
    expect(screen.getByText(/indices/)).toBeInTheDocument();
    expect(screen.getByText('nums = [2, 7, 11, 15], target = 9')).toBeInTheDocument();
    expect(screen.getByLabelText<HTMLTextAreaElement>('Code editor').value).toContain('function twoSum');

    await user.click(screen.getByRole('tab', { name: 'Hints' }));
    expect(screen.queryByText(/Which question does the inner loop ask/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show hint 1 of 2' }));
    expect(screen.getByText(/Which question does the inner loop ask/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Solution' }));
    expect(screen.queryByText(/Remember every value/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show the solution' }));
    expect(await screen.findByText(/Remember every value/)).toBeInTheDocument();
  });

  it('runs only the example tests and reports real results from your code', async () => {
    const api = installFakeApi({
      'GET /preferences': preferences,
      'GET /practice/problems/two-sum': makeProblemDetail(),
      'POST /practice/problems/two-sum/attempts': attemptResponse(),
    });
    const user = userEvent.setup();
    await renderApp('/practice/two-sum');

    const editor = await screen.findByLabelText('Code editor');
    fireEvent.change(editor, { target: { value: TWO_SUM_SOLUTION } });
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByText('2 of 2 tests passed')).toBeInTheDocument();
    expect(screen.getByText('Example run')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();

    await waitFor(() => expect(api.callsTo('POST', '/practice/problems/two-sum/attempts')).toHaveLength(1));
    expect(api.callsTo('POST', '/practice/problems/two-sum/attempts')[0]?.body).toMatchObject({
      language: 'typescript',
      kind: 'run',
      status: 'passed',
      passedCount: 2,
      totalCount: 2,
      code: TWO_SUM_SOLUTION,
    });
  });

  it('submits every test, including hidden ones, and celebrates the first solve', async () => {
    const api = installFakeApi({
      'GET /preferences': preferences,
      'GET /practice/problems/two-sum': makeProblemDetail(),
      'POST /practice/problems/two-sum/attempts': attemptResponse(true),
    });
    const user = userEvent.setup();
    await renderApp('/practice/two-sum');

    fireEvent.change(await screen.findByLabelText('Code editor'), { target: { value: TWO_SUM_SOLUTION } });
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('3 of 3 tests passed')).toBeInTheDocument();
    expect(screen.getByText('All tests passed')).toBeInTheDocument();
    expect(await screen.findByText('Problem solved')).toBeInTheDocument();
    expect(api.callsTo('POST', '/practice/problems/two-sum/attempts')[0]?.body).toMatchObject({
      kind: 'submit',
      status: 'passed',
      passedCount: 3,
      totalCount: 3,
    });
  });

  it('shows the input, expected value and actual output of a failing test', async () => {
    installFakeApi({
      'GET /preferences': preferences,
      'GET /practice/problems/two-sum': makeProblemDetail(),
      'POST /practice/problems/two-sum/attempts': attemptResponse(),
    });
    const user = userEvent.setup();
    await renderApp('/practice/two-sum');

    fireEvent.change(await screen.findByLabelText('Code editor'), {
      target: { value: 'function twoSum(nums, target) { return [0, 0]; }' },
    });
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByText('0 of 2 tests passed')).toBeInTheDocument();
    const results = screen.getByRole('region', { name: 'Test results' });
    expect(within(results).getByText('[0,1]')).toBeInTheDocument();
    expect(within(results).getAllByText('[0,0]').length).toBeGreaterThan(0);
  });

  it('explains syntax errors instead of failing silently', async () => {
    installFakeApi({
      'GET /preferences': preferences,
      'GET /practice/problems/two-sum': makeProblemDetail(),
      'POST /practice/problems/two-sum/attempts': attemptResponse(),
    });
    const user = userEvent.setup();
    await renderApp('/practice/two-sum');

    fireEvent.change(await screen.findByLabelText('Code editor'), { target: { value: 'function twoSum(nums, target) {' } });
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByText('Your code could not run')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Syntax or setup error');
  });

  it('restores the last saved code and links to the next problem', async () => {
    installFakeApi({
      'GET /preferences': preferences,
      'GET /practice/problems/two-sum': makeProblemDetail({
        latestCode: { language: 'typescript', code: '// my earlier attempt\n', savedAt: '2026-10-18T06:00:00.000Z' },
      }),
    });
    await renderApp('/practice/two-sum');

    expect((await screen.findByLabelText<HTMLTextAreaElement>('Code editor')).value).toBe('// my earlier attempt\n');
    expect(screen.getByRole('link', { name: /Next problem/ })).toHaveAttribute('href', '/practice/group-anagrams');
    expect(screen.getByRole('link', { name: /Hashing patterns/ })).toHaveAttribute('href', '/lessons/hashing-interview-patterns');
  });
});
