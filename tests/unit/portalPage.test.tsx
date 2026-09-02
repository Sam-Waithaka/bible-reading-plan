// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PortalPage from '../../src/pages/PortalPage';

const mocks = vi.hoisted(() => ({
  permissions: [] as string[],
  user: {
    email: 'thakas@example.com',
    emailVerified: true,
    firstName: 'Thakas',
    groups: [],
    id: 7,
    lastName: '',
    permissions: [] as string[],
    phoneNumber: '',
    profile: { bio: '', displayName: 'thakas', location: '', ministryOrDepartment: '', profilePhoto: null, relationshipToChurch: '' },
    username: 'thakas',
  },
}));

vi.mock('../../src/hooks/useTheme', () => ({
  useTheme: () => ({ darkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    accessToken: 'access-token',
    groups: [],
    hasGroup: vi.fn(),
    hasPermission: (permission: string) => mocks.permissions.includes(permission),
    hasPortalAccess: true,
    permissions: mocks.permissions,
    refreshSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    status: 'authenticated',
    tokens: { access: 'access-token', refresh: 'refresh-token' },
    user: { ...mocks.user, permissions: mocks.permissions },
  }),
}));

vi.mock('../../src/components/navigation/SiteHeader', () => ({
  default: () => <header>Site header</header>,
}));

vi.mock('../../src/components/navigation/SiteFooter', () => ({
  default: () => <footer>Site footer</footer>,
}));

const renderPage = async (root: Root) => {
  await act(async () => {
    root.render(
      <MemoryRouter>
        <PortalPage />
      </MemoryRouter>,
    );
    await Promise.resolve();
  });
};

describe('PortalPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mocks.permissions = [];
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders a calm general-member dashboard without restricted writing actions', async () => {
    await renderPage(root);

    expect(container.textContent).toContain('Welcome back');
    expect(container.textContent).toContain('Good');
    expect(container.textContent).toContain('thakas');
    expect(container.textContent).toContain("You're all caught up.");
    expect(container.textContent).toContain('Open Scripture');
    expect(container.textContent).toContain('Project 52');
    expect(container.textContent).toContain('Available to you');
    expect(container.textContent).not.toContain('New Article');
    expect(container.textContent).not.toContain('Editorial Queue');
    expect(container.textContent).not.toContain('Library Management');
    expect(container.querySelector('a[href="/portal/writing/new"]')).toBeNull();
    expect(container.querySelector('a[href="/portal/writing/editorial"]')).toBeNull();
  });

  it('renders writing and editorial capabilities only for permitted users', async () => {
    mocks.permissions = [
      'writings.create_writing',
      'writings.review_writing',
      'writings.publish_writing',
      'writings.manage_taxonomy',
      'writings.view_any_draft_writing',
    ];

    await renderPage(root);

    expect(container.textContent).toContain('Review submissions');
    expect(container.textContent).toContain('New Article');
    expect(container.textContent).toContain('Editorial Queue');
    expect(container.textContent).toContain('Writing Studio');
    expect(container.textContent).toContain('Library Management');
    expect(container.querySelector('a[href="/portal/writing/new"]')).not.toBeNull();
    expect(container.querySelector('a[href="/portal/writing/editorial"]')).not.toBeNull();
    expect(container.querySelector('a[href="/portal/writing/library"]')).not.toBeNull();
  });
});
