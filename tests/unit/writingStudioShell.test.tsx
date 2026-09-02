// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WritingStudioShell from '../../src/components/portal/writing/WritingStudioShell';

const mocks = vi.hoisted(() => ({
  permissions: [] as string[],
}));

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({ permissions: mocks.permissions }),
}));

vi.mock('../../src/hooks/useTheme', () => ({
  useTheme: () => ({ darkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock('../../src/components/navigation/SiteHeader', () => ({
  default: () => <header>Site header</header>,
}));

vi.mock('../../src/components/navigation/SiteFooter', () => ({
  default: () => <footer>Site footer</footer>,
}));

vi.mock('../../src/components/portal/writing/WritingAccessDenied', () => ({
  default: () => <div>Writing access denied</div>,
}));

const renderShell = async (root: Root) => {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/portal/writing"]}>
        <WritingStudioShell>
          <p>Studio content</p>
        </WritingStudioShell>
      </MemoryRouter>,
    );
  });
};

describe('WritingStudioShell mobile navigation', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mocks.permissions = ['writings.edit_own_writing'];
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('opens a mobile sheet with only permitted Writing Studio sections', async () => {
    mocks.permissions = ['writings.create_writing', 'writings.manage_taxonomy', 'writings.review_writing'];
    await renderShell(root);

    const openButton = container.querySelector('button[aria-label="Open Writing Studio sections"]') as HTMLButtonElement;
    expect(openButton).not.toBeNull();

    await act(async () => openButton.click());

    const sheet = container.querySelector('#writing-studio-mobile-nav');
    expect(sheet).not.toBeNull();
    expect(sheet?.textContent).toContain('Overview');
    expect(sheet?.textContent).toContain('Articles');
    expect(sheet?.textContent).toContain('New Article');
    expect(sheet?.textContent).toContain('Library');
    expect(sheet?.textContent).toContain('Editorial');
  });

  it('does not expose restricted mobile routes and closes with Escape', async () => {
    await renderShell(root);

    const openButton = container.querySelector('button[aria-label="Open Writing Studio sections"]') as HTMLButtonElement;
    await act(async () => openButton.click());

    let sheet = container.querySelector('#writing-studio-mobile-nav');
    expect(sheet?.textContent).toContain('Overview');
    expect(sheet?.textContent).toContain('Articles');
    expect(sheet?.textContent).not.toContain('New Article');
    expect(sheet?.textContent).not.toContain('Library');
    expect(sheet?.textContent).not.toContain('Editorial');

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    sheet = container.querySelector('#writing-studio-mobile-nav');
    expect(sheet).toBeNull();
  });
});
