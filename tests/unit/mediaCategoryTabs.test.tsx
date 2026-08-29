// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MediaCategoryTabs from '../../src/components/media/MediaCategoryTabs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('MediaCategoryTabs floating collections control', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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

  it('uses the Resources-anchored pill and accessible 50vh scrollable sheet', async () => {
    await act(async () => root.render(<MediaCategoryTabs activeTab="all" darkMode={false} onTabChange={vi.fn()} />));
    const trigger = container.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;

    expect(trigger.textContent).toContain('All Media');
    expect(trigger.getAttribute('aria-label')).toBe('Media Collections: All Media');
    expect(trigger.className).toContain('rounded-full');
    expect(trigger.className).toContain('bg-[#fffaf0]');
    expect(trigger.querySelector('.lucide-circle-play')).not.toBeNull();

    await act(async () => trigger.click());
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog.className).toContain('max-h-[50dvh]');
    expect(dialog.querySelector('.overflow-y-auto')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');

    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('selects a collection and closes the sheet', async () => {
    const onTabChange = vi.fn();
    await act(async () => root.render(<MediaCategoryTabs activeTab="all" darkMode onTabChange={onTabChange} />));
    const trigger = container.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;
    await act(async () => trigger.click());
    const sermons = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find((button) => button.textContent?.includes('Sermons'))!;

    await act(async () => sermons.click());

    expect(onTabChange).toHaveBeenCalledWith('sermons');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
