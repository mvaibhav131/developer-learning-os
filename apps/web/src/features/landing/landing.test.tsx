import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { errorResponse, installFakeApi } from '../../test/fake-api';
import { makePreferences, makeProjectSummary, makeTrack, makeTracks } from '../../test/fixtures';
import { renderApp } from '../../test/render';

const preferences = makePreferences({ locale: 'en', theme: 'light' });

describe('landing page', () => {
  it('shows catalog numbers that come from the API', async () => {
    const base = makeTrack();
    installFakeApi({
      'GET /preferences': preferences,
      'GET /tracks': {
        tracks: [
          makeTrack({ stats: { ...base.stats, completeLessonCount: 12 } }),
          makeTrack({ slug: 'dsa', title: 'Data Structures and Algorithms', shortTitle: 'DSA', sortOrder: 2, stats: { ...base.stats, completeLessonCount: 7 } }),
        ],
      },
      'GET /projects': {
        projects: [makeProjectSummary(), makeProjectSummary({ slug: 'prompt-playground' }), makeProjectSummary({ slug: 'rag-basics' })],
      },
    });
    await renderApp('/');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your personal developer academy for the AI era' }),
    ).toBeInTheDocument();

    expect((await screen.findByText('learning tracks')).parentElement).toHaveTextContent('learning tracks2');
    // Only lessons that are really written are counted, not every planned title.
    expect(screen.getByText('lessons ready to study').parentElement).toHaveTextContent('lessons ready to study19');
    expect(screen.getByText('week roadmap').parentElement).toHaveTextContent('week roadmap24');
    expect(screen.getByText('hands-on AI labs').parentElement).toHaveTextContent('hands-on AI labs3');

    const aiCard = screen.getByRole('link', { name: /AI Engineering/ });
    expect(aiCard).toHaveAttribute('href', '/learn/ai');
    expect(within(aiCard).getByText('Build LLM applications from prompts to production.')).toBeInTheDocument();
  });

  it('never invents numbers when the API is unreachable', async () => {
    installFakeApi({
      'GET /preferences': errorResponse(500, 'internal_error', 'down'),
      'GET /tracks': errorResponse(500, 'internal_error', 'down'),
      'GET /projects': errorResponse(500, 'internal_error', 'down'),
    });
    await renderApp('/');

    const stat = await screen.findByText('learning tracks');
    await screen.findAllByText('\u2013');
    expect(stat.parentElement).not.toHaveTextContent(/\d/);
    expect(screen.getByText('week roadmap').parentElement).toHaveTextContent('week roadmap24');
  });

  it('links every call to action to the working dashboard', async () => {
    installFakeApi({ 'GET /preferences': preferences, 'GET /tracks': makeTracks(), 'GET /projects': { projects: [] } });
    await renderApp('/');

    const links = await screen.findAllByRole('link', { name: 'Open dashboard' });
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) expect(link).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Explore the curriculum' })).toHaveAttribute('href', '#tracks');
  });

  it('lists what works today separately from what is still planned', async () => {
    installFakeApi({ 'GET /preferences': preferences, 'GET /tracks': makeTracks(), 'GET /projects': { projects: [] } });
    await renderApp('/');

    const ready = (await screen.findByRole('heading', { name: 'Available now' })).parentElement;
    const next = screen.getByRole('heading', { name: 'Coming next' }).parentElement;
    expect(ready).toHaveTextContent('Dashboard computed from real study sessions');
    expect(ready).toHaveTextContent('DSA problems you solve and test inside the app');
    expect(next).toHaveTextContent('RAG lab with local Ollama models (Phase 5)');
    expect(next).toHaveTextContent('Most titles are still planned');
    expect(ready).not.toHaveTextContent('Phase 5');
  });
});
