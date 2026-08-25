// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  authenticatedFetch,
  refreshStoredAuthTokens,
  subscribeToAuthSession,
} from '../../src/services/authSession';
import {
  readStoredAuthTokens,
  storeAuthTokens,
} from '../../src/utils/authStorage';

const jsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
    ...init,
  });

const authorization = (init?: RequestInit) => new Headers(init?.headers).get('Authorization');

describe('authenticated session requests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('uses a valid access token without refreshing', async () => {
    storeAuthTokens({ access: 'valid-access', refresh: 'valid-refresh' });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(authenticatedFetch('/v1/writings/', 'stale-prop-token')).resolves.toMatchObject({ status: 200 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(authorization(fetchMock.mock.calls[0][1])).toBe('Bearer valid-access');
  });

  it('refreshes an expired access token, persists rotated tokens, and retries once', async () => {
    storeAuthTokens({ access: 'expired-access', refresh: 'refresh-a' });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ code: 'token_not_valid' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ access: 'fresh-access', refresh: 'refresh-b' }))
      .mockResolvedValueOnce(jsonResponse({ saved: true }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await authenticatedFetch('/v1/writings/9/', 'expired-access', { method: 'PATCH' });

    await expect(response.json()).resolves.toEqual({ saved: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/v1/auth/token/refresh/');
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({
      body: JSON.stringify({ refresh: 'refresh-a' }),
      method: 'POST',
    }));
    expect(authorization(fetchMock.mock.calls[2][1])).toBe('Bearer fresh-access');
    expect(readStoredAuthTokens()).toEqual({ access: 'fresh-access', refresh: 'refresh-b' });
  });

  it('keeps the existing refresh token when rotation is not enabled', async () => {
    storeAuthTokens({ access: 'expired-access', refresh: 'refresh-a' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ access: 'fresh-access' })));

    await expect(refreshStoredAuthTokens()).resolves.toEqual({
      access: 'fresh-access',
      refresh: 'refresh-a',
    });
    expect(readStoredAuthTokens()).toEqual({
      access: 'fresh-access',
      refresh: 'refresh-a',
    });
  });

  it('clears the session when refresh is invalid', async () => {
    storeAuthTokens({ access: 'expired-access', refresh: 'expired-refresh' });
    const events: string[] = [];
    const unsubscribe = subscribeToAuthSession((event) => events.push(event.type));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'refresh invalid' }, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(authenticatedFetch('/v1/writings/', 'expired-access')).rejects.toThrow('session has expired');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(readStoredAuthTokens()).toBeNull();
    expect(events).toEqual(['cleared']);
    unsubscribe();
  });

  it('does not enter an infinite retry loop when the retried request is unauthorized', async () => {
    storeAuthTokens({ access: 'expired-access', refresh: 'valid-refresh' });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ access: 'fresh-access' }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'still unauthorized' }, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await authenticatedFetch('/v1/writings/', 'expired-access');

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.filter(([url]) => url === '/v1/auth/token/refresh/')).toHaveLength(1);
    expect(readStoredAuthTokens()).toBeNull();
  });

  it('uses one refresh for simultaneous expired requests and retries every waiter', async () => {
    storeAuthTokens({ access: 'expired-access', refresh: 'refresh-a' });
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/v1/auth/token/refresh/') {
        return Promise.resolve(jsonResponse({ access: 'fresh-access', refresh: 'refresh-b' }));
      }

      return Promise.resolve(
        authorization(init) === 'Bearer fresh-access'
          ? jsonResponse({ ok: true })
          : jsonResponse({ detail: 'expired' }, { status: 401 }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const responses = await Promise.all([
      authenticatedFetch('/v1/writings/1/', 'expired-access'),
      authenticatedFetch('/v1/writings/2/', 'expired-access'),
      authenticatedFetch('/v1/writings/3/', 'expired-access'),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(fetchMock.mock.calls.filter(([url]) => url === '/v1/auth/token/refresh/')).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(readStoredAuthTokens()).toEqual({ access: 'fresh-access', refresh: 'refresh-b' });
  });
});
