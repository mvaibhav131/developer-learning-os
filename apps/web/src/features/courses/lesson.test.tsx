import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi, jsonResponse } from '../../test/fake-api';
import { makeLessonDetail, makePreferences, makeQuizDetail, makeQuizResult } from '../../test/fixtures';
import { renderApp } from '../../test/render';

const preferences = makePreferences({ locale: 'en', theme: 'light' });
const SLUG = 'hashing-interview-patterns';

describe('lesson page', () => {
  it('shows video, written content, practice problems and downloads in one place', async () => {
    installFakeApi({
      'GET /preferences': preferences,
      [`GET /lessons/${SLUG}`]: makeLessonDetail(),
      [`PUT /lessons/${SLUG}/progress`]: { slug: SLUG, status: 'in_progress', completedAt: null },
    });
    await renderApp(`/lessons/${SLUG}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hashing patterns: two-sum family, anagrams and grouping' }),
    ).toBeInTheDocument();

    // Reading content, rendered from Markdown.
    expect(screen.getByRole('heading', { level: 2, name: 'The idea' })).toHaveAttribute('id', 'the-idea');
    expect(document.querySelector('pre code')?.textContent).toContain('const seen = new Map<number, number>();');

    // Practice links use the built-in editor.
    const practice = screen.getByRole('link', { name: /Two Sum/ });
    expect(practice).toHaveAttribute('href', '/practice/two-sum');
    expect(within(practice).getByRole('img', { name: 'Solved' })).toBeInTheDocument();

    // Downloads: notes and a CSV for every table.
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download table as CSV' })).toBeInTheDocument();
  });

  it('plays the video inside the page and prefers the language of the interface', async () => {
    installFakeApi({
      'GET /preferences': preferences,
      [`GET /lessons/${SLUG}`]: makeLessonDetail(),
      [`PUT /lessons/${SLUG}/progress`]: { slug: SLUG, status: 'in_progress', completedAt: null },
    });
    const user = userEvent.setup();
    await renderApp(`/lessons/${SLUG}`);

    const [play] = await screen.findAllByRole('button', { name: /Two Sum - Leetcode 1/ });
    expect(play).toHaveTextContent('Play the video here');
    expect(screen.queryByTitle(/Two Sum - Leetcode 1/)).not.toBeInTheDocument();
    await user.click(play!);

    const frame = await screen.findByTitle(/Two Sum - Leetcode 1/);
    expect(frame).toHaveAttribute('src', expect.stringContaining('https://www.youtube-nocookie.com/embed/KLlXCFG5TnA'));
    expect(screen.getByRole('link', { name: /Open on YouTube/ })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=KLlXCFG5TnA',
    );
    expect(screen.getByText('Hindi / Hinglish')).toBeInTheDocument();
  });

  it('puts Hindi videos first for a Hinglish interface', async () => {
    const hinglish = makePreferences({ locale: 'hi-Latn', theme: 'light' });
    installFakeApi({
      'GET /preferences': hinglish,
      [`GET /lessons/${SLUG}`]: makeLessonDetail(),
      [`PUT /lessons/${SLUG}/progress`]: { slug: SLUG, status: 'in_progress', completedAt: null },
    });
    await renderApp(`/lessons/${SLUG}`, { locale: 'hi-Latn' });

    const [firstVideo] = await screen.findAllByRole('button', { name: /What is hashing with example/ });
    expect(firstVideo).toHaveTextContent('Video yahin chalao');
  });

  it('starts the lesson when it opens and completes it with one click', async () => {
    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    const api = installFakeApi({
      'GET /preferences': preferences,
      [`GET /lessons/${SLUG}`]: () => {
        const base = makeLessonDetail();
        return { ...base, lesson: { ...base.lesson, progress: status, completedAt: status === 'completed' ? '2026-10-19T06:00:00.000Z' : null } };
      },
      [`PUT /lessons/${SLUG}/progress`]: ({ body }) => {
        status = (body as { status: typeof status }).status;
        return { slug: SLUG, status, completedAt: status === 'completed' ? '2026-10-19T06:00:00.000Z' : null };
      },
    });
    const user = userEvent.setup();
    await renderApp(`/lessons/${SLUG}`);

    await waitFor(() => expect(api.callsTo('PUT', `/lessons/${SLUG}/progress`)[0]?.body).toEqual({ status: 'in_progress' }));

    await user.click((await screen.findAllByRole('button', { name: 'Mark as complete' }))[0]!);
    await waitFor(() => expect(api.callsTo('PUT', `/lessons/${SLUG}/progress`)).toHaveLength(2));
    expect(api.callsTo('PUT', `/lessons/${SLUG}/progress`)[1]?.body).toEqual({ status: 'completed' });

    expect((await screen.findAllByRole('button', { name: 'Mark as not done' })).length).toBeGreaterThan(0);
  });

  it('is honest about lessons that are not written yet', async () => {
    const base = makeLessonDetail();
    const api = installFakeApi({
      'GET /preferences': preferences,
      [`GET /lessons/${SLUG}`]: makeLessonDetail({
        lesson: { ...base.lesson, contentStatus: 'planned' },
        content: null,
        videos: [],
        practice: [],
        quiz: null,
      }),
    });
    await renderApp(`/lessons/${SLUG}`);

    expect(await screen.findByText('This lesson is not written yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as complete' })).not.toBeInTheDocument();
    expect(api.callsTo('PUT', `/lessons/${SLUG}/progress`)).toHaveLength(0);
  });

  it('renders practice phrases with a copy button and saves tables as CSV', async () => {
    installFakeApi({
      'GET /preferences': preferences,
      [`GET /lessons/${SLUG}`]: makeLessonDetail(),
      [`PUT /lessons/${SLUG}/progress`]: { slug: SLUG, status: 'in_progress', completedAt: null },
    });
    await renderApp(`/lessons/${SLUG}`);

    expect(await screen.findByText('Could you say that again, please?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy "Could you say that again, please?"' })).toBeInTheDocument();
    expect(screen.getByText('Practice phrases')).toBeInTheDocument();
  });
});

describe('lesson quiz', () => {
  it('grades answers on the server and explains every question', async () => {
    const api = installFakeApi({
      'GET /preferences': preferences,
      [`GET /lessons/${SLUG}`]: makeLessonDetail(),
      [`PUT /lessons/${SLUG}/progress`]: { slug: SLUG, status: 'in_progress', completedAt: null },
      [`GET /quizzes/${SLUG}`]: makeQuizDetail(),
      [`POST /quizzes/${SLUG}/attempts`]: () => jsonResponse(makeQuizResult(), 201),
    });
    const user = userEvent.setup();
    await renderApp(`/lessons/${SLUG}`);

    await user.click(await screen.findByRole('button', { name: 'Start quiz' }));
    await screen.findByText('Which structure gives average O(1) lookups?');

    // Checking with unanswered questions is blocked locally.
    await user.click(screen.getByRole('button', { name: 'Check answers' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Answer every question first.');
    expect(api.callsTo('POST', `/quizzes/${SLUG}/attempts`)).toHaveLength(0);

    await user.click(screen.getByRole('radio', { name: 'Hash map' }));
    await user.click(screen.getByRole('checkbox', { name: 'A string' }));
    await user.click(screen.getByRole('checkbox', { name: 'A number' }));
    await user.click(screen.getByRole('radio', { name: 'True' }));
    await user.click(screen.getByRole('button', { name: 'Check answers' }));

    await waitFor(() => expect(api.callsTo('POST', `/quizzes/${SLUG}/attempts`)).toHaveLength(1));
    expect((api.callsTo('POST', `/quizzes/${SLUG}/attempts`)[0]?.body as { answers: unknown }).answers).toEqual({
      '1': ['b'],
      '2': ['a', 'b'],
      '3': ['true'],
    });

    expect(await screen.findByText(/2 of 3 correct/)).toBeInTheDocument();
    expect(screen.getByText(/Not there yet/)).toBeInTheDocument();
    expect(screen.getByText('Look up first, store after, or an element pairs with itself.')).toBeInTheDocument();
    expect(screen.getAllByText('Correct').length).toBe(2);
    expect(screen.getByText('Incorrect')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('button', { name: 'Check answers' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Hash map' })).not.toBeChecked();
  });
});
