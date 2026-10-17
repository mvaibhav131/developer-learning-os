import type { Locale, Theme } from '@dlos/shared';
import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { Providers } from '../app/providers';
import { routes } from '../app/router';
import { i18n } from '../lib/i18n';
import { queryClient } from '../lib/queries';
import { useUiStore } from '../stores/ui-store';

/** Renders the real route table inside the real providers, starting at `path`. */
export async function renderApp(
  path = '/dashboard',
  options: { locale?: Locale; theme?: Theme } = {},
) {
  const { locale = 'en', theme = 'light' } = options;

  queryClient.clear();
  queryClient.setDefaultOptions({
    queries: { retry: false, staleTime: 0 },
    mutations: { retry: false },
  });
  useUiStore.setState({ locale, theme, sidebarCollapsed: false });
  await i18n.changeLanguage(locale);

  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...view, router };
}
