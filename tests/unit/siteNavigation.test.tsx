// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SiteNavigation from '../../src/components/navigation/SiteNavigation';
import type { AuthUser } from '../../src/types/auth';

const mocks = vi.hoisted(() => ({
  auth: {
    hasPortalAccess: false,
    permissions: [] as string[],
    signOut: vi.fn(),
    user: null as AuthUser | null,
  },
}));

vi.mock('../../src/hooks/useAuth', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../src/hooks/useCompactHeader', () => ({ useCompactHeader: () => false }));
vi.mock('../../src/components/auth/SignInModal', () => ({ default: () => null }));

describe('SiteNavigation', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mocks.auth.hasPortalAccess = false;
    mocks.auth.permissions = [];
    mocks.auth.signOut.mockReset();
    mocks.auth.user = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.body.style.overflow = '';
  });

  const renderAt = async (pathname: string) => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[pathname]}>
          <SiteNavigation darkMode={false} layout="top" onToggleTheme={vi.fn()} />
        </MemoryRouter>,
      );
    });
  };

  it('marks one public parent active on a nested route', async () => {
    await renderAt('/resources/type/insights');
    const active = container.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toContain('Resources');
  });

  it('shows the mobile Give action on public routes but not the Give page', async () => {
    await renderAt('/');
    expect(container.querySelector('a[aria-label="Give"]')).not.toBeNull();
    act(() => root.unmount());
    root = createRoot(container);
    await renderAt('/give');
    expect(container.querySelector('a[aria-label="Give"]')).toBeNull();
  });

  it('locks scrolling, closes on Escape, and restores focus', async () => {
    await renderAt('/');
    const triggers = container.querySelectorAll<HTMLButtonElement>('button[aria-label="Open navigation menu"]');
    const trigger = triggers[triggers.length - 1];
    trigger.focus();
    await act(async () => trigger.click());
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');
    expect(container.querySelector('a[aria-label="Give"]')).toBeNull();
    expect(container.querySelector('button[aria-controls="drawer-nav-community-items"]')?.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('button[aria-controls="drawer-nav-preferences-items"]')?.getAttribute('aria-expanded')).toBe('false');
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(trigger);
  });

  it('augments the stable public drawer with compact authorized account access', async () => {
    mocks.auth.hasPortalAccess = true;
    mocks.auth.user = {
      email: 'thakas@example.com', emailVerified: true, firstName: 'Thakas', groups: [], id: 1,
      lastName: 'User', permissions: [], phoneNumber: '', profile: null, username: 'thakas',
    };
    await renderAt('/resources');
    const triggers = container.querySelectorAll<HTMLButtonElement>('button[aria-label="Open navigation menu"]');
    await act(async () => triggers[triggers.length - 1].click());
    const drawer = container.querySelector('[role="dialog"]')!;
    expect(drawer.textContent).toContain('Home');
    expect(drawer.textContent).toContain('Resources');
    expect(drawer.textContent).toContain('My Account');
    expect(drawer.textContent).toContain('Enter Staff Portal');
    expect(drawer.textContent).not.toContain('Signed in');
  });

  it('uses a separate Portal navigation context', async () => {
    mocks.auth.hasPortalAccess = true;
    mocks.auth.user = {
      email: 'staff@example.com', emailVerified: true, firstName: 'Staff', groups: [], id: 2,
      lastName: 'Member', permissions: [], phoneNumber: '', profile: null, username: 'staff',
    };
    await renderAt('/portal');
    expect(container.textContent).toContain('Staff Portal');
    expect(container.textContent).toContain('Back to Site');
    expect(container.querySelector('a[aria-label="Give"]')).toBeNull();
  });
});
