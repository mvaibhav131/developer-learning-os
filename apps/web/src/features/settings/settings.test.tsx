import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '../../test/fake-api';
import { makeHealth, makePreferences, patchPreferences } from '../../test/fixtures';
import { renderApp } from '../../test/render';

function storedUi(): { state: { locale: string; theme: string } } {
  return JSON.parse(window.localStorage.getItem('dlos-ui') ?? '{}') as {
    state: { locale: string; theme: string };
  };
}

describe('settings: language', () => {
  it('defaults to Hinglish and switches to English and Hindi without a reload', async () => {
    const stored = makePreferences({ locale: 'hi-Latn', theme: 'light' });
    const api = installFakeApi({
      'GET /preferences': stored,
      'PATCH /preferences': patchPreferences(stored),
      'GET /health': makeHealth(),
    });
    const user = userEvent.setup();
    await renderApp('/settings', { locale: 'hi-Latn', theme: 'light' });

    expect(await screen.findByText('Preferences aapke local database me save hoti hain.')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('hi-Latn');
    expect(screen.getByRole('radio', { name: 'Hinglish (Hindi in Latin script)' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'English' }));
    expect(await screen.findByText('Preferences are stored in your local database.')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(storedUi().state.locale).toBe('en');
    await waitFor(() => expect(api.callsTo('PATCH', '/preferences')).toHaveLength(1));
    expect(api.callsTo('PATCH', '/preferences')[0]?.body).toEqual({ locale: 'en' });

    await user.click(screen.getByRole('radio', { name: 'Hindi (Devanagari)' }));
    expect(await screen.findByText('पसंद आपके लोकल डेटाबेस में सहेजी जाती हैं।')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('hi');
    expect(storedUi().state.locale).toBe('hi');
  });

  it('keeps the navigation labelled in the selected language', async () => {
    const stored = makePreferences({ locale: 'hi', theme: 'light' });
    installFakeApi({ 'GET /preferences': stored, 'GET /health': makeHealth() });
    await renderApp('/settings', { locale: 'hi', theme: 'light' });

    expect(await screen.findByRole('heading', { level: 1, name: 'सेटिंग्स' })).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'मुख्य नेविगेशन' }).length).toBeGreaterThan(0);
  });
});

describe('settings: theme', () => {
  it('applies and persists the chosen theme', async () => {
    const stored = makePreferences({ locale: 'en', theme: 'light' });
    const api = installFakeApi({
      'GET /preferences': stored,
      'PATCH /preferences': patchPreferences(stored),
      'GET /health': makeHealth(),
    });
    const user = userEvent.setup();
    await renderApp('/settings', { locale: 'en', theme: 'light' });

    await screen.findByRole('heading', { level: 1, name: 'Settings' });
    expect(document.documentElement).not.toHaveClass('dark');

    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(storedUi().state.theme).toBe('dark');
    await waitFor(() => expect(api.callsTo('PATCH', '/preferences')).toHaveLength(1));
    expect(api.callsTo('PATCH', '/preferences')[0]?.body).toEqual({ theme: 'dark' });

    await user.click(screen.getByRole('radio', { name: 'Light' }));
    await waitFor(() => expect(document.documentElement).not.toHaveClass('dark'));
  });
});

describe('settings: preferences form', () => {
  it('validates goals locally and saves valid values', async () => {
    const stored = makePreferences({ locale: 'en', theme: 'light' });
    const api = installFakeApi({
      'GET /preferences': stored,
      'PATCH /preferences': patchPreferences(stored),
      'GET /health': makeHealth(),
    });
    const user = userEvent.setup();
    await renderApp('/settings', { locale: 'en', theme: 'light' });

    const aiGoal = await screen.findByLabelText('AI Engineering');
    expect(aiGoal).toHaveValue('60');
    expect(screen.getByText('Daily target: 120 min')).toBeInTheDocument();

    await user.clear(aiGoal);
    await user.type(aiGoal, 'abc');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Goals must be whole numbers from 0 to 480 minutes',
    );
    expect(api.callsTo('PATCH', '/preferences')).toHaveLength(0);

    await user.clear(aiGoal);
    await user.type(aiGoal, '90');
    expect(screen.getByText('Daily target: 150 min')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(api.callsTo('PATCH', '/preferences')).toHaveLength(1));
    expect(api.callsTo('PATCH', '/preferences')[0]?.body).toMatchObject({
      displayName: 'Asha',
      timezone: 'Asia/Kolkata',
      streakMinMinutes: 10,
      dailyGoals: { ai: 90, dsa: 30, 'system-design': 30, 'full-stack': 0, interview: 0 },
    });
    expect(await screen.findByText('Settings saved')).toBeInTheDocument();
  });

  it('requires a display name', async () => {
    const stored = makePreferences({ locale: 'en', theme: 'light' });
    const api = installFakeApi({
      'GET /preferences': stored,
      'PATCH /preferences': patchPreferences(stored),
      'GET /health': makeHealth(),
    });
    const user = userEvent.setup();
    await renderApp('/settings', { locale: 'en', theme: 'light' });

    const name = await screen.findByLabelText('Display name');
    await user.clear(name);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a display name');
    expect(api.callsTo('PATCH', '/preferences')).toHaveLength(0);
  });

  it('reports the AI provider status honestly', async () => {
    const stored = makePreferences({ locale: 'en', theme: 'light' });
    installFakeApi({ 'GET /preferences': stored, 'GET /health': makeHealth() });
    await renderApp('/settings', { locale: 'en', theme: 'light' });

    expect(await screen.findByText('None configured')).toBeInTheDocument();
    expect(screen.getByText('No AI provider is configured.')).toBeInTheDocument();
  });
});
