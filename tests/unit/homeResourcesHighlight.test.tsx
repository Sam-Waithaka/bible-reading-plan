// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HomeResourcesHighlight from '../../src/components/landing/HomeResourcesHighlight';
import type { PublicWritingCard, ResourcesHome } from '../../src/types/writing';

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

  it('lets both cards in a two-writing shelf render their complete optional content', async () => {
    const writing = (id: number, excerpt: string) => ({
      author_display: `Author ${id}`,
      excerpt,
      id,
      og_image_detail: null,
      reading_time_minutes: id + 2,
      slug: `writing-${id}`,
      title: `A complete responsive title for writing ${id}`,
      writing_type: 'Insights',
    }) as PublicWritingCard;

    mocks.fetchResourcesHome.mockResolvedValueOnce({
      featured_articles: [],
      featured_series: [],
      latest_articles: [
        writing(1, 'The newest publication keeps its full editorial summary.'),
        writing(2, 'The supporting publication can carry the same information.'),
      ],
    } as ResourcesHome);

    await act(async () => {
      root.render(<MemoryRouter><HomeResourcesHighlight darkMode={false} /></MemoryRouter>);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('The newest publication keeps its full editorial summary.');
    expect(container.textContent).toContain('The supporting publication can carry the same information.');
    expect(container.textContent).toContain('Author 1');
    expect(container.textContent).toContain('Author 2');
    expect(container.querySelector('.auto-rows-auto')).not.toBeNull();
  });
});
