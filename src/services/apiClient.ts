import { getApiBaseUrl } from '../config/env';

export type ApiRequestOptions = {
  cache?: 'none' | 'memory';
  signal?: AbortSignal;
  timeoutMs?: number;
};

type ApiErrorOptions = {
  cause?: unknown;
  detail?: string;
  endpoint: string;
  status?: number;
};

const DEFAULT_TIMEOUT_MS = 15000;
const defaultHeaders = {
  Accept: 'application/json',
};
const inFlightRequests = new Map<string, Promise<unknown>>();
const memoryCache = new Map<string, unknown>();

export class ApiError extends Error {
  detail?: string;
  endpoint: string;
  status?: number;

  constructor(message: string, { cause, detail, endpoint, status }: ApiErrorOptions) {
    super(message, { cause });
    this.name = 'ApiError';
    this.detail = detail;
    this.endpoint = endpoint;
    this.status = status;
  }
}

export const createApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const readBackendDetail = (payload: unknown) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const detail = record.detail || record.error || record.message;

  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  return undefined;
};

const parseResponseBody = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const createAbortController = (signal: AbortSignal | undefined, timeoutMs: number) => {
  const controller = new AbortController();
  let timedOut = false;

  const timeout = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortFromParent = () => controller.abort(signal?.reason);

  if (signal?.aborted) {
    abortFromParent();
  } else {
    signal?.addEventListener('abort', abortFromParent, { once: true });
  }

  return {
    controller,
    didTimeOut: () => timedOut,
    dispose: () => {
      globalThis.clearTimeout(timeout);
      signal?.removeEventListener('abort', abortFromParent);
    },
  };
};

const requestJson = async <T>(endpoint: string, options: ApiRequestOptions): Promise<T> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const abort = createAbortController(options.signal, timeoutMs);

  try {
    const response = await fetch(endpoint, {
      headers: defaultHeaders,
      signal: abort.controller.signal,
    });
    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const detail = readBackendDetail(payload);
      throw new ApiError(detail || `Scripture API request failed with status ${response.status}.`, {
        detail,
        endpoint,
        status: response.status,
      });
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (abort.didTimeOut()) {
      throw new ApiError('The Scripture API request timed out.', {
        cause: error,
        detail: 'Request timed out.',
        endpoint,
      });
    }

    if (options.signal?.aborted || abort.controller.signal.aborted) {
      throw new ApiError('The Scripture API request was cancelled.', {
        cause: error,
        detail: 'Request cancelled.',
        endpoint,
      });
    }

    throw new ApiError('We could not reach the Scripture API.', {
      cause: error,
      detail: error instanceof Error ? error.message : undefined,
      endpoint,
    });
  } finally {
    abort.dispose();
  }
};

export const apiGet = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const endpoint = createApiUrl(path);
  const cacheMode = options.cache ?? 'none';

  if (cacheMode === 'memory' && memoryCache.has(endpoint)) {
    return memoryCache.get(endpoint) as T;
  }

  // Requests with a caller-owned AbortSignal are intentionally not shared; aborting
  // one consumer should not cancel another consumer's identical request.
  const canDedupe = !options.signal;
  const existingRequest = canDedupe ? inFlightRequests.get(endpoint) : undefined;

  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const request = requestJson<T>(endpoint, options)
    .then((payload) => {
      if (cacheMode === 'memory') {
        memoryCache.set(endpoint, payload);
      }

      return payload;
    })
    .finally(() => {
      inFlightRequests.delete(endpoint);
    });

  if (canDedupe) {
    inFlightRequests.set(endpoint, request);
  }

  return request;
};

export const invalidateApiCache = (pathPrefix: string) => {
  const endpointPrefix = createApiUrl(pathPrefix);

  for (const endpoint of memoryCache.keys()) {
    if (endpoint.startsWith(endpointPrefix)) {
      memoryCache.delete(endpoint);
    }
  }
};

export const clearApiClientCaches = () => {
  inFlightRequests.clear();
  memoryCache.clear();
};
