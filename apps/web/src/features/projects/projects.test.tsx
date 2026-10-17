import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '../../test/fake-api';
import { makePreferences, makeProjectDetail, makeProjectSummary } from '../../test/fixtures';
import { renderApp } from '../../test/render';

const preferences = makePreferences({ locale: 'en', theme: 'light' });

describe('AI labs', () => {
  it('lists the labs with real milestone progress and status', async () => {
    installFakeApi({
      'GET /preferences': preferences,
      'GET /projects': {
        projects: [
          makeProjectSummary({ status: 'in_progress', milestonesDone: 1 }),
          makeProjectSummary({
            slug: 'prompt-playground',
            title: 'Lab 2: Prompt playground',
            milestonesTotal: 4,
          }),
        ],
      },
    });
    await renderApp('/projects');

    const first = await screen.findByRole('link', { name: /Lab 1: Typed LLM API client/ });
    expect(first).toHaveAttribute('href', '/projects/ts-llm-api-client');
    expect(within(first).getByText('In progress')).toBeInTheDocument();
    expect(within(first).getByText('1 of 2 done')).toBeInTheDocument();

    const second = screen.getByRole('link', { name: /Lab 2: Prompt playground/ });
    expect(within(second).getByText('Not started')).toBeInTheDocument();
    expect(within(second).getByText('0 of 4 done')).toBeInTheDocument();
  });

  it('starts a lab, checks milestones and links prerequisites', async () => {
    let done: number[] = [];
    const api = installFakeApi({
      'GET /preferences': preferences,
      'GET /projects/ts-llm-api-client': () => makeProjectDetail(done),
      'POST /projects/ts-llm-api-client/start': () => {
        done = [];
        return { ...makeProjectDetail(done), project: { ...makeProjectDetail(done).project, status: 'in_progress' } };
      },
      'PUT /projects/ts-llm-api-client/milestones/11': ({ body }) => {
        done = (body as { completed: boolean }).completed ? [11] : [];
        return makeProjectDetail(done);
      },
    });
    const user = userEvent.setup();
    await renderApp('/projects/ts-llm-api-client');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Lab 1: Typed LLM API client' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LLM API integration patterns' })).toHaveAttribute(
      'href',
      '/lessons/llm-api-integration',
    );
    expect(screen.getByRole('link', { name: 'Lab 4: PDF Q&A application' })).toHaveAttribute(
      'href',
      '/projects/pdf-qa-app',
    );
    expect(screen.getByText('Step-by-step guide planned for Phase 5')).toBeInTheDocument();

    const first = screen.getByRole('checkbox', { name: 'Mark "Typed request builder" as done' });
    expect(first).not.toBeChecked();
    await user.click(first);

    await waitFor(() => expect(api.callsTo('PUT', '/projects/ts-llm-api-client/milestones/11')).toHaveLength(1));
    expect(api.callsTo('PUT', '/projects/ts-llm-api-client/milestones/11')[0]?.body).toEqual({ completed: true });
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Mark "Typed request builder" as done' })).toBeChecked(),
    );
    expect(screen.getAllByText('1 of 2 done').length).toBeGreaterThan(0);
  });

  it('shows an error state for an unknown lab', async () => {
    installFakeApi({ 'GET /preferences': preferences });
    await renderApp('/projects/does-not-exist');

    expect(await screen.findByText('Could not load this data')).toBeInTheDocument();
  });
});
