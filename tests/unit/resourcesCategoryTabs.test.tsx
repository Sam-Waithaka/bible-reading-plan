// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResourcesCategoryTabs from '../../src/components/resources/ResourcesCategoryTabs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const resourceTypes = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: index === 11 ? 'Pastoral Leadership and Church Life' : 'Category ' + (index + 1),
  slug: 'category-' + (index + 1),
})) as never[];

describe('ResourcesCategoryTabs', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    window.history.replaceState({}, '', '/resources');
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it('supports a scalable desktop category list and an active floating label', async () => {
    await act(async () => root.render(<ResourcesCategoryTabs darkMode resourceTypes={resourceTypes} />));

    expect(container.querySelectorAll('a[href^="/resources/type/"]')).toHaveLength(12);
    const trigger = container.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]');
    expect(trigger?.textContent).toContain('All Resources');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens an accessible sheet, closes with Escape, and restores trigger focus', async () => {
    await act(async () => root.render(<ResourcesCategoryTabs darkMode={false} resourceTypes={resourceTypes} />));
    const trigger = container.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;

    await act(async () => trigger.click());
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');

    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('');
  });
});