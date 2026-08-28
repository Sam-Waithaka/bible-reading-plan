// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HomeResourcesHighlight from '../../src/components/landing/HomeResourcesHighlight';

const mocks = vi.hoisted(() => ({ fetchResourcesHome: vi.fn() }));

vi.mock('../../src/services/resourcesApi', () => ({ fetchResourcesHome: mocks.fetchResourcesHome }));

describe('HomeResourcesHighlight loading shell', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mocks.fetchResourcesHome.mockReset();
    mocks.fetchResourcesHome.mockReturnValue(new Promise(() => undefined));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders static editorial copy and resource skeletons before data resolves', async () => {
    await act(async () => {
      root.render(<MemoryRouter><HomeResourcesHighlight darkMode={false} /></MemoryRouter>);
      await Promise.resolve();
    });

    expect(container.textContent).toContain('From the library');
    expect(container.textContent).toContain('Go further. Stay rooted.');
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Loading latest resource"]')).not.toBeNull();
  });
});
