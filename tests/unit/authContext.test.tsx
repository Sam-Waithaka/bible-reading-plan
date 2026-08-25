// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { useAuth } from '../../src/hooks/useAuth';

const jsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
    ...init,
  });

const userPayload = {
  id: 4,
  username: 'editor',
  email: 'editor@example.com',
  phone_number: '0711111111',
  first_name: 'Editor',
  last_name: 'User',
  email_verified: true,
  groups: ['Writing Editor'],
  permissions: ['writings.edit_writing'],
  profile: null,
};

const memberPayload = {
  ...userPayload,
  groups: [],
  permissions: [],
  username: 'member',
};

const AuthProbe = () => {
  const auth = useAuth();

  return (
    <div>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="username">{auth.user?.username || ''}</p>
      <p data-testid="portal">{auth.hasPortalAccess ? 'yes' : 'no'}</p>
      <p data-testid="permission">{auth.hasPermission('writings.edit_writing') ? 'yes' : 'no'}</p>
      <button type="button" onClick={() => void auth.signIn('editor', 'secret')}>Sign in</button>
      <button type="button" onClick={() => void auth.signOut()}>Sign out</button>
    </div>
  );
};

describe('AuthProvider', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.restoreAllMocks();
    window.localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('boots as anonymous when there are no stored tokens', async () => {
    vi.stubGlobal('fetch', vi.fn());

    await act(async () => {
      root.render(<AuthProvider><AuthProbe /></AuthProvider>);
    });

    expect(container.querySelector('[data-testid="status"]')?.textContent).toBe('anonymous');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('signs in, stores tokens, exposes permissions, and signs out', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access: 'access-token', refresh: 'refresh-token' }))
      .mockResolvedValueOnce(jsonResponse(userPayload))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      root.render(<AuthProvider><AuthProbe /></AuthProvider>);
    });
    await act(async () => {
      container.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="status"]')?.textContent).toBe('authenticated');
    expect(container.querySelector('[data-testid="username"]')?.textContent).toBe('editor');
    expect(container.querySelector('[data-testid="portal"]')?.textContent).toBe('yes');
    expect(container.querySelector('[data-testid="permission"]')?.textContent).toBe('yes');
    expect(window.localStorage.getItem('aic.auth.access')).toBe('access-token');

    await act(async () => {
      container.querySelectorAll('button')[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="status"]')?.textContent).toBe('anonymous');
    expect(window.localStorage.getItem('aic.auth.access')).toBeNull();
    expect(fetchMock).toHaveBeenLastCalledWith('/v1/auth/logout/', expect.objectContaining({
      body: JSON.stringify({ refresh: 'refresh-token' }),
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
    }));
  });

  it('bootstraps from stored tokens and refreshes when /me rejects the access token', async () => {
    window.localStorage.setItem('aic.auth.access', 'expired-access');
    window.localStorage.setItem('aic.auth.refresh', 'refresh-token');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ access: 'fresh-access', refresh: 'rotated-refresh' }))
      .mockResolvedValueOnce(jsonResponse(userPayload));
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      root.render(<AuthProvider><AuthProbe /></AuthProvider>);
    });

    expect(container.querySelector('[data-testid="status"]')?.textContent).toBe('authenticated');
    expect(window.localStorage.getItem('aic.auth.access')).toBe('fresh-access');
    expect(window.localStorage.getItem('aic.auth.refresh')).toBe('rotated-refresh');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/auth/token/refresh/', expect.objectContaining({
      body: JSON.stringify({ refresh: 'refresh-token' }),
    }));
  });

  it('allows any authenticated user into the portal shell while keeping permissions separate', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access: 'access-token', refresh: 'refresh-token' }))
      .mockResolvedValueOnce(jsonResponse(memberPayload));
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      root.render(<AuthProvider><AuthProbe /></AuthProvider>);
    });
    await act(async () => {
      container.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="portal"]')?.textContent).toBe('yes');
    expect(container.querySelector('[data-testid="permission"]')?.textContent).toBe('no');
  });
  it('clears stale tokens and becomes anonymous when refresh fails', async () => {
    window.localStorage.setItem('aic.auth.access', 'expired-access');
    window.localStorage.setItem('aic.auth.refresh', 'expired-refresh');
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired access' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired refresh' }, { status: 401 })));

    await act(async () => {
      root.render(<AuthProvider><AuthProbe /></AuthProvider>);
    });

    expect(container.querySelector('[data-testid="status"]')?.textContent).toBe('anonymous');
    expect(container.querySelector('[data-testid="username"]')?.textContent).toBe('');
    expect(container.querySelector('[data-testid="portal"]')?.textContent).toBe('no');
    expect(window.localStorage.getItem('aic.auth.access')).toBeNull();
    expect(window.localStorage.getItem('aic.auth.refresh')).toBeNull();
  });
});
