import type { AuthTokens } from '../types/auth';
import {
  clearStoredAuthTokens,
  readStoredAuthTokens,
  storeAuthTokens,
} from '../utils/authStorage';
import { createApiUrl } from './apiClient';

type AuthSessionEvent =
  | { tokens: AuthTokens; type: 'refreshed' }
  | { type: 'cleared' };

type AuthSessionListener = (event: AuthSessionEvent) => void;

const listeners = new Set<AuthSessionListener>();
let refreshRequest: Promise<AuthTokens> | null = null;

const notify = (event: AuthSessionEvent) => {
  listeners.forEach((listener) => listener(event));
};

const clearSession = () => {
  clearStoredAuthTokens();
  notify({ type: 'cleared' });
};

const parseTokenResponse = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) return {} as Record<string, unknown>;

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
};

const performRefresh = async (refreshFallback?: string): Promise<AuthTokens> => {
  try {
    const storedTokens = readStoredAuthTokens();
    const currentTokens = storedTokens || (refreshFallback ? { access: '', refresh: refreshFallback } : null);
    if (!currentTokens) {
      throw new Error('No refresh token is available.');
    }

    const response = await fetch(createApiUrl('/v1/auth/token/refresh/'), {
      body: JSON.stringify({ refresh: currentTokens.refresh }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const payload = await parseTokenResponse(response);
    const access = typeof payload.access === 'string' ? payload.access : '';
    const refresh = typeof payload.refresh === 'string' ? payload.refresh : currentTokens.refresh;

    if (!response.ok || !access) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    const nextTokens = { access, refresh };
    storeAuthTokens(nextTokens);
    notify({ tokens: nextTokens, type: 'refreshed' });
    return nextTokens;
  } catch (error) {
    clearSession();
    throw error;
  }
};

export const refreshStoredAuthTokens = (refreshFallback?: string) => {
  if (!refreshRequest) {
    refreshRequest = performRefresh(refreshFallback).finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
};

export const subscribeToAuthSession = (listener: AuthSessionListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const withAccessToken = (headers: HeadersInit | undefined, accessToken: string): HeadersInit => {
  if (!headers || (!Array.isArray(headers) && !(headers instanceof Headers))) {
    return {
      ...(headers as Record<string, string> | undefined),
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const nextHeaders = new Headers(headers);
  nextHeaders.set('Authorization', `Bearer ${accessToken}`);
  return nextHeaders;
};

export const authenticatedFetch = async (
  input: RequestInfo | URL,
  accessToken: string,
  init: RequestInit = {},
) => {
  const storedAccess = readStoredAuthTokens()?.access;
  const firstResponse = await fetch(input, {
    ...init,
    headers: withAccessToken(init.headers, storedAccess || accessToken),
  });

  if (firstResponse.status !== 401) return firstResponse;

  const nextTokens = await refreshStoredAuthTokens();
  const retryResponse = await fetch(input, {
    ...init,
    headers: withAccessToken(init.headers, nextTokens.access),
  });

  if (retryResponse.status === 401) clearSession();
  return retryResponse;
};
