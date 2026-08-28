import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiGet, clearApiClientCaches, createApiUrl, invalidateApiCache } from '../../src/services/apiClient';

const jsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
    ...init,
  });

describe('apiClient', () => {
  beforeEach(() => {
    clearApiClientCaches();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearApiClientCaches();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('builds API URLs from relative paths', () => {
    expect(createApiUrl('/v1/bible/versions/')).toBe('/v1/bible/versions/');
    expect(createApiUrl('v1/bible/versions/')).toBe('/v1/bible/versions/');
  });

  it('attaches JSON headers and parses successful responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiGet<{ ok: boolean }>('/v1/example/')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('/v1/example/', expect.objectContaining({
      headers: { Accept: 'application/json' },
    }));
  });

  it('preserves status and backend detail on HTTP errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ detail: 'Search query must be at least 2 characters.' }, { status: 400 })),
    );

    await expect(apiGet('/v1/bible/search/?q=a')).rejects.toMatchObject({
      detail: 'Search query must be at least 2 characters.',
      endpoint: '/v1/bible/search/?q=a',
      status: 400,
    });
  });

  it('wraps network failures in ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiGet('/v1/down/')).rejects.toBeInstanceOf(ApiError);
    await expect(apiGet('/v1/down/')).rejects.toMatchObject({
      detail: 'Failed to fetch',
      endpoint: '/v1/down/',
    });
  });

  it('deduplicates identical in-flight GET requests when no caller signal is provided', async () => {
    let resolveRequest: (response: Response) => void = () => {};
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const first = apiGet<{ id: string }>('/v1/bible/versions/');
    const second = apiGet<{ id: string }>('/v1/bible/versions/');
    resolveRequest(jsonResponse({ id: 'BSB' }));

    await expect(Promise.all([first, second])).resolves.toEqual([{ id: 'BSB' }, { id: 'BSB' }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses memory cache only when requested', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ cached: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/v1/bible/versions/', { cache: 'memory' });
    await apiGet('/v1/bible/versions/', { cache: 'memory' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('invalidates only memory-cache entries matching an API path prefix', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ source: 'resources-home-1' }))
      .mockResolvedValueOnce(jsonResponse({ source: 'resources-navigation-1' }))
      .mockResolvedValueOnce(jsonResponse({ source: 'media-home-1' }))
      .mockResolvedValueOnce(jsonResponse({ source: 'resources-home-2' }))
      .mockResolvedValueOnce(jsonResponse({ source: 'resources-navigation-2' }));
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/v1/resources/home/', { cache: 'memory' });
    await apiGet('/v1/resources/navigation/?category_slug=leadership', { cache: 'memory' });
    await apiGet('/v1/audio-visual/home/', { cache: 'memory' });

    invalidateApiCache('/v1/resources/');

    await expect(apiGet('/v1/resources/home/', { cache: 'memory' })).resolves.toEqual({ source: 'resources-home-2' });
    await expect(apiGet('/v1/resources/navigation/?category_slug=leadership', { cache: 'memory' })).resolves.toEqual({ source: 'resources-navigation-2' });
    await expect(apiGet('/v1/audio-visual/home/', { cache: 'memory' })).resolves.toEqual({ source: 'media-home-1' });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('still clears every memory-cache namespace', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ version: 1 }))
      .mockResolvedValueOnce(jsonResponse({ version: 1 }))
      .mockResolvedValueOnce(jsonResponse({ version: 2 }))
      .mockResolvedValueOnce(jsonResponse({ version: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/v1/resources/home/', { cache: 'memory' });
    await apiGet('/v1/audio-visual/home/', { cache: 'memory' });
    clearApiClientCaches();
    await apiGet('/v1/resources/home/', { cache: 'memory' });
    await apiGet('/v1/audio-visual/home/', { cache: 'memory' });

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('allows caller-owned AbortSignal to cancel a request', async () => {
    const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal;

      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const request = apiGet('/v1/bible/search/?q=love', { signal: controller.signal });

    controller.abort();

    await expect(request).rejects.toMatchObject({
      detail: 'Request cancelled.',
      endpoint: '/v1/bible/search/?q=love',
    });
  });

  it('times out requests that do not resolve', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal;

      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = apiGet('/v1/slow/', { timeoutMs: 25 });
    const expectation = expect(request).rejects.toMatchObject({
      detail: 'Request timed out.',
      endpoint: '/v1/slow/',
    });

    await vi.advanceTimersByTimeAsync(25);

    await expectation;
  });
});
