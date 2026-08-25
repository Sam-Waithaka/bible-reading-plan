// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SignInModal from '../../src/components/auth/SignInModal';
import { AuthProvider } from '../../src/contexts/AuthContext';

const jsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
    ...init,
  });

const staffUser = {
  id: 8,
  username: 'publisher',
  email: 'publisher@example.com',
  phone_number: '0722222222',
  first_name: 'Publisher',
  last_name: 'User',
  email_verified: true,
  groups: ['Writing Publisher'],
  permissions: ['writings.publish_writing'],
  profile: null,
};

const memberUser = {
  ...staffUser,
  groups: [],
  permissions: [],
  username: 'member',
};

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('SignInModal', () => {
  let container: HTMLDivElement;
  let root: Root;
  let assignedPath = '';

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.restoreAllMocks();
    window.localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    assignedPath = '';
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign: (path: string) => {
          assignedPath = path;
        },
      },
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  const renderModal = async () => {
    await act(async () => {
      root.render(
        <AuthProvider>
          <SignInModal darkMode={false} open onClose={() => undefined} />
        </AuthProvider>,
      );
    });
  };

  it('renders the identifier/password form and accessible actions', async () => {
    vi.stubGlobal('fetch', vi.fn());

    await renderModal();

    expect(container.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Sign in');
    expect(container.textContent).toContain('Email, phone, or username');
    expect(container.textContent).toContain('Password');
    expect(container.textContent).toContain('Forgot password?');
  });

  it('toggles password visibility without changing its value', async () => {
    vi.stubGlobal('fetch', vi.fn());

    await renderModal();
    const passwordInput = container.querySelectorAll('input')[1] as HTMLInputElement;
    const showPasswordButton = container.querySelector('button[aria-label="Show password"]') as HTMLButtonElement;

    await act(async () => {
      setInputValue(passwordInput, 'secret');
      showPasswordButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(passwordInput.type).toBe('text');
    expect(passwordInput.value).toBe('secret');
    expect(container.querySelector('button[aria-label="Hide password"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows an accessible spinner while sign-in is pending', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));

    await renderModal();
    const inputs = container.querySelectorAll('input');
    await act(async () => {
      setInputValue(inputs[0] as HTMLInputElement, 'publisher');
      setInputValue(inputs[1] as HTMLInputElement, 'secret');
    });
    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
    expect(submitButton.getAttribute('aria-busy')).toBe('true');
    expect(submitButton.querySelector('svg')?.getAttribute('class')).toContain('motion-safe:animate-spin');
    expect(submitButton.textContent).toBe('Signing in');
    expect(submitButton.textContent).not.toContain('Signing in...');
  });

  it('submits identifier credentials and redirects staff users to /portal', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access: 'access-token', refresh: 'refresh-token' }))
      .mockResolvedValueOnce(jsonResponse(staffUser));
    vi.stubGlobal('fetch', fetchMock);

    await renderModal();
    const inputs = container.querySelectorAll('input');
    await act(async () => {
      setInputValue(inputs[0] as HTMLInputElement, '0722222222');
      setInputValue(inputs[1] as HTMLInputElement, 'secret');
    });
    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/v1/auth/token/', expect.objectContaining({
      body: JSON.stringify({ identifier: '0722222222', password: 'secret' }),
    }));
    expect(assignedPath).toBe('/portal');
  });

  it('redirects authenticated users without permissions to /portal', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access: 'access-token', refresh: 'refresh-token' }))
      .mockResolvedValueOnce(jsonResponse(memberUser)));

    await renderModal();
    const inputs = container.querySelectorAll('input');
    await act(async () => {
      setInputValue(inputs[0] as HTMLInputElement, 'member');
      setInputValue(inputs[1] as HTMLInputElement, 'secret');
    });
    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(assignedPath).toBe('/portal');
  });

  it('shows the church-admin account creation error when login fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'No active account found.' }, { status: 401 })));

    await renderModal();
    const inputs = container.querySelectorAll('input');
    await act(async () => {
      setInputValue(inputs[0] as HTMLInputElement, 'missing@example.com');
      setInputValue(inputs[1] as HTMLInputElement, 'wrong');
    });
    await act(async () => {
      container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container.textContent).toContain('Please contact the church admin for account creation.');
    expect(assignedPath).toBe('');
  });

  it('requests password reset using the identifier field', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await renderModal();
    await act(async () => {
      setInputValue(container.querySelector('input') as HTMLInputElement, 'samuel@example.com');
    });
    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Forgot password?')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenCalledWith('/v1/auth/request-password-reset/', expect.objectContaining({
      body: JSON.stringify({ identifier: 'samuel@example.com' }),
    }));
    expect(container.textContent).toContain('If this account exists');
  });
});
