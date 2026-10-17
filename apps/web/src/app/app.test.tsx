import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '../test/fake-api';
import { makeDashboard, makeHealth, makePreferences } from '../test/fixtures';
import { renderApp } from '../test/render';

async function primaryNav() {
  const [sidebar] = await screen.findAllByRole('navigation', { name: 'Primary navigation' });
  if (!sidebar) throw new Error('Sidebar navigation not found');
  return within(sidebar);
}

describe('navigation shell', () => {
  const preferences = makePreferences({ locale: 'en', theme: 'light' });

  it('marks the current page in the sidebar and follows links', async () => {
    installFakeApi({
      'GET /preferences': preferences,
      'GET /dashboard': makeDashboard(),
      'GET /health': makeHealth(),
    });
    const user = userEvent.setup();
    const { router } = await renderApp('/dashboard');

    const nav = await primaryNav();
    expect(await nav.findByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Settings' })).not.toHaveAttribute('aria-current');

    await user.click(nav.getByRole('link', { name: 'Settings' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/settings'));
    await waitFor(() =>
      expect(nav.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page'),
    );
    expect(nav.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  });

  it('lists only places that work, including every track and DSA practice', async () => {
    installFakeApi({ 'GET /preferences': preferences, 'GET /dashboard': makeDashboard() });
    await renderApp('/dashboard');

    const nav = await primaryNav();
    for (const name of ['DSA practice', 'English Communication', 'AI Engineering', 'AI labs', 'Roadmap']) {
      expect(await nav.findByRole('link', { name })).toBeInTheDocument();
    }
    expect(nav.queryByText('Planned')).not.toBeInTheDocument();
    expect(nav.queryByRole('link', { name: /Flashcards|Notes|Playground/ })).not.toBeInTheDocument();
  });

  it('is honest about planned features and shows no fake data', async () => {
    installFakeApi({ 'GET /preferences': preferences });
    await renderApp('/analytics');

    expect(await screen.findByRole('heading', { level: 1, name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByText('Planned for phase 6')).toBeInTheDocument();
    expect(screen.getByText('Not built yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the roadmap' })).toHaveAttribute('href', '/roadmap');
  });

  it('shows a helpful 404 page for unknown routes', async () => {
    installFakeApi({ 'GET /preferences': preferences });
    await renderApp('/this/does-not-exist');

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText(/\/this\/does-not-exist/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(document.title).toBe('Page not found · Developer Learning OS');
  });

  it('offers a skip link that targets the main landmark', async () => {
    installFakeApi({ 'GET /preferences': preferences });
    await renderApp('/this/does-not-exist');

    const skip = await screen.findByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });
});
