import { API_PREFIX } from '@dlos/shared';
import { vi } from 'vitest';

export interface FakeRequest {
  method: string;
  path: string;
  search: string;
  body: unknown;
}

type Handler = ((request: FakeRequest) => unknown) | object | string | number | boolean | null;

export function jsonResponse(body: unknown, status = 200): Response {
  if (status === 204) return new Response(null, { status });
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(status: number, code: string, message: string): Response {
  return jsonResponse({ error: { code, message } }, status);
}

/**
 * Replaces `fetch` with a router keyed by "METHOD /path" (path without the API prefix).
 * A handler is a JSON-serialisable value, a Response, or a function returning either.
 * Unknown routes answer 404 so a forgotten fixture fails loudly instead of hanging.
 */
export function installFakeApi(handlers: Record<string, Handler>) {
  const calls: FakeRequest[] = [];

  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(href, 'http://localhost');
    const method = (init?.method ?? 'GET').toUpperCase();
    const path = url.pathname.startsWith(API_PREFIX) ? url.pathname.slice(API_PREFIX.length) : url.pathname;
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    const request: FakeRequest = { method, path, search: url.search, body };
    calls.push(request);

    const handler = handlers[`${method} ${path}`];
    if (handler === undefined) {
      return Promise.resolve(errorResponse(404, 'not_found', `No fake handler for ${method} ${path}`));
    }
    const result: unknown = typeof handler === 'function' ? (handler as (r: FakeRequest) => unknown)(request) : handler;
    // A Response body can be read once, so hand out clones when a handler reuses the same object.
    return Promise.resolve(result instanceof Response ? result.clone() : jsonResponse(result));
  });

  vi.stubGlobal('fetch', fetchMock);

  return {
    calls,
    fetchMock,
    callsTo: (method: string, path: string) =>
      calls.filter((call) => call.method === method.toUpperCase() && call.path === path),
  };
}
