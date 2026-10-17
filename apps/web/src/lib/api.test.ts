import * as contract from '@dlos/shared';
import { describe, expect, it } from 'vitest';
import { errorResponse, installFakeApi, jsonResponse } from '../test/fake-api';
import { makePreferences } from '../test/fixtures';
import { ApiError, callApi } from './api';

describe('callApi', () => {
  it('builds the URL from the contract and drops empty query values', async () => {
    const fake = installFakeApi({ 'GET /courses': { courses: [] } });
    await callApi(contract.listCourses, { query: { track: 'ai', q: '' } });

    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]).toMatchObject({ method: 'GET', path: '/courses', search: '?track=ai' });
  });

  it('encodes path parameters', async () => {
    const fake = installFakeApi({ 'GET /courses/rag-mastery': errorResponse(404, 'not_found', 'nope') });
    await expect(callApi(contract.getCourse, { params: { slug: 'rag-mastery' } })).rejects.toBeInstanceOf(ApiError);
    expect(fake.calls[0]?.path).toBe('/courses/rag-mastery');
  });

  it('sends JSON bodies with the contract method', async () => {
    const stored = makePreferences({ theme: 'dark' });
    const fake = installFakeApi({ 'PATCH /preferences': stored });
    const result = await callApi(contract.updatePreferences, { body: { theme: 'dark' } });

    expect(result.theme).toBe('dark');
    expect(fake.calls[0]).toMatchObject({ method: 'PATCH', path: '/preferences', body: { theme: 'dark' } });
    const init = fake.fetchMock.mock.calls[0]?.[1];
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('turns API error bodies into ApiError with status and code', async () => {
    installFakeApi({ 'GET /preferences': errorResponse(422, 'validation_error', 'Bad input') });

    await expect(callApi(contract.getPreferences)).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      code: 'validation_error',
      message: 'Bad input',
    });
  });

  it('falls back to a generic error when the body is not an API error', async () => {
    installFakeApi({ 'GET /preferences': new Response('<html>oops</html>', { status: 502 }) });

    await expect(callApi(contract.getPreferences)).rejects.toMatchObject({
      status: 502,
      code: 'http_error',
    });
  });

  it('wraps network failures', async () => {
    const fake = installFakeApi({});
    fake.fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(callApi(contract.getPreferences)).rejects.toMatchObject({
      status: 0,
      code: 'network_error',
    });
  });

  it('rejects responses that do not satisfy the shared contract', async () => {
    installFakeApi({ 'GET /preferences': jsonResponse({ displayName: 'Asha' }) });

    await expect(callApi(contract.getPreferences)).rejects.toThrow();
  });

  it('accepts empty 204 responses', async () => {
    installFakeApi({ 'DELETE /plan/tasks/7': jsonResponse(null, 204) });

    await expect(callApi(contract.deletePlanTask, { params: { id: 7 } })).resolves.toBeUndefined();
  });
});
