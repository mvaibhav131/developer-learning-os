import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { errorResponse, installFakeApi, jsonResponse } from '../../test/fake-api';
import { makeDashboard, makePreferences } from '../../test/fixtures';
import { renderApp } from '../../test/render';

const preferences = makePreferences({ locale: 'en', theme: 'light' });

describe('dashboard', () => {
  it('renders values computed by the API, not hard-coded numbers', async () => {
    installFakeApi({ 'GET /preferences': preferences, 'GET /dashboard': makeDashboard() });
    await renderApp('/dashboard');

    expect(
      await screen.findByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Asha/ }),
    ).toBeInTheDocument();

    expect(screen.getByText('How LLMs work')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Mark "How LLMs work" as done' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Mark "Arrays and hashing drills" as done' })).toBeChecked();

    expect(screen.getByText('45 of 120 min')).toBeInTheDocument();
    expect(screen.getByText('Day streak').parentElement).toHaveTextContent('Day streak4');
    expect(screen.getByText('Day streak').parentElement).toHaveTextContent('Best: 9 days');
    expect(screen.getByText('Current roadmap week')).toBeInTheDocument();
    expect(screen.getByText('A typed LLM client')).toBeInTheDocument();

    // The one lesson to open next, and practice progress, come from the API too.
    expect(screen.getByText('Big O analysis: time, space and amortized cost')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open lesson/ })).toHaveAttribute('href', '/lessons/big-o-analysis');
    expect(screen.getByText('2 of 30 solved')).toBeInTheDocument();
    expect(screen.getByText('Problems solved').parentElement).toHaveTextContent('Problems solved2');
  });

  it('shows an honest empty state when nothing is scheduled and no lesson is ready', async () => {
    installFakeApi({
      'GET /preferences': preferences,
      'GET /dashboard': makeDashboard({
        todayTasks: [],
        nextUp: null,
        continueLesson: null,
        practice: { total: 0, solved: 0, attempted: 0 },
      }),
    });
    await renderApp('/dashboard');

    expect(
      await screen.findByText('Nothing is scheduled for today. Check the roadmap or log some extra study.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No lesson with written content is waiting. Browse the tracks to find one.')).toBeInTheDocument();
    expect(screen.getByText('No practice problems yet.')).toBeInTheDocument();
  });

  it('shows an error state with a working retry when the API fails', async () => {
    let attempts = 0;
    installFakeApi({
      'GET /preferences': preferences,
      'GET /dashboard': () =>
        ++attempts === 1 ? errorResponse(500, 'internal_error', 'Boom') : jsonResponse(makeDashboard()),
    });
    const user = userEvent.setup();
    await renderApp('/dashboard');

    expect(await screen.findByText('Could not load this data')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Asha/ }),
    ).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('logs a study session and refreshes the dashboard', async () => {
    let dashboard = makeDashboard();
    const api = installFakeApi({
      'GET /preferences': preferences,
      'GET /dashboard': () => dashboard,
      'POST /study-sessions': (request) => {
        dashboard = makeDashboard({
          daily: { ...dashboard.daily, studiedMinutes: 70, percent: 58 },
        });
        return jsonResponse(
          {
            id: 1,
            trackSlug: 'ai',
            durationMinutes: 25,
            startedAt: '2026-10-19T05:30:00.000Z',
            localDate: '2026-10-19',
            source: 'manual',
            note: null,
            planTaskId: null,
            lessonSlug: null,
            ...(request.body as object),
          },
          201,
        );
      },
    });
    const user = userEvent.setup();
    await renderApp('/dashboard');

    await screen.findByText('45 of 120 min');
    await user.click(screen.getAllByRole('button', { name: 'Log study time' })[0]!);

    const dialog = await screen.findByRole('dialog', { name: 'Log study time' });
    const minutes = within(dialog).getByLabelText('Minutes');
    await user.clear(minutes);
    await user.type(minutes, '25');
    await user.click(within(dialog).getByRole('button', { name: 'Log session' }));

    await waitFor(() => expect(api.callsTo('POST', '/study-sessions')).toHaveLength(1));
    expect(api.callsTo('POST', '/study-sessions')[0]?.body).toMatchObject({
      trackSlug: 'ai',
      durationMinutes: 25,
      source: 'manual',
    });
    expect(await screen.findByText('70 of 120 min')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Log study time' })).not.toBeInTheDocument());
  });

  it('rejects invalid minutes before calling the API', async () => {
    const api = installFakeApi({
      'GET /preferences': preferences,
      'GET /dashboard': makeDashboard(),
    });
    const user = userEvent.setup();
    await renderApp('/dashboard');

    await screen.findByText('45 of 120 min');
    await user.click(screen.getAllByRole('button', { name: 'Log study time' })[0]!);
    const dialog = await screen.findByRole('dialog', { name: 'Log study time' });
    const minutes = within(dialog).getByLabelText('Minutes');
    await user.clear(minutes);
    await user.type(minutes, '0');
    await user.click(within(dialog).getByRole('button', { name: 'Log session' }));

    expect(await within(dialog).findByText('Enter a whole number between 1 and 600.')).toBeInTheDocument();
    expect(api.callsTo('POST', '/study-sessions')).toHaveLength(0);
  });
});
