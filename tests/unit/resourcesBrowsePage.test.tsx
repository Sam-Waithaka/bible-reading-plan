// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResourcesBrowsePage from '../../src/pages/ResourcesBrowsePage';

const mocks = vi.hoisted(() => ({
  fetchResourceTypeDetail: vi.fn(),
  searchPublicWritings: vi.fn(),
}));

vi.mock('../../src/hooks/useTheme', () => ({
  useTheme: () => ({ darkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock('../../src/components/navigation/SiteHeader', () => ({
  default: () => <header>Site Header</header>,
}));

vi.mock('../../src/components/navigation/SiteFooter', () => ({
  default: () => <footer>Site Footer</footer>,
}));

vi.mock('../../src/services/publicSearchApi', () => ({
  searchPublicWritings: mocks.searchPublicWritings,
}));

vi.mock('../../src/services/resourcesApi', () => ({
  fetchResourceTypeDetail: mocks.fetchResourceTypeDetail,
}));

const article = (overrides: Record<string, unknown> = {}) => ({
  author_attributions: [{ display_name: 'Pastor Jane', id: 1, is_primary: true, order: 0, role: 'AUTHOR' }],
  author_display: 'Pastor Jane',
  byline: 'Pastor Jane',
  categories: [],
  excerpt: 'A public article excerpt.',
  id: 10,
  ministries: [],
  og_image_detail: null,
  published_at: '2026-07-17T09:00:00Z',
  reading_time_minutes: 6,
  resource_type_detail: { id: 1, name: 'Devotional', slug: 'devotional' },
  scripture_references: [],
  seo_description: 'SEO description.',
  seo_title: 'SEO title',
  series: [],
  slug: 'grace-for-today',
  tags: [],
  title: 'Grace for Today',
  writing_type: 'ARTICLE',
  ...overrides,
});

const renderBrowse = async (root: Root, path: string, route: string, mode: 'book' | 'category' | 'ministry' | 'series' | 'type') => {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={route} element={<ResourcesBrowsePage mode={mode} />} />
        </Routes>
      </MemoryRouter>,
    );
    await Promise.resolve();
  });
};

describe('ResourcesBrowsePage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mocks.fetchResourceTypeDetail.mockReset();
    mocks.searchPublicWritings.mockReset();
    mocks.fetchResourceTypeDetail.mockResolvedValue({
      articles: {
        count: 1,
        next: null,
        previous: null,
        results: [article()],
      },
      categories: [{ id: 2, name: 'Prayer', slug: 'prayer' }],
      category_rails: [{ category: { id: 2, name: 'Prayer', slug: 'prayer' }, count: 1, items: [article({ id: 20, title: 'Prayer Resource', slug: 'prayer-resource' })] }],
      featured_articles: [article({ id: 21, title: 'Featured Devotional', slug: 'featured-devotional' })],
      latest_articles: [article({ id: 22, title: 'Latest Devotional', slug: 'latest-devotional' })],
      resource_type: { id: 1, name: 'Devotional', slug: 'devotional', description: 'Devotional resources for the church.' },
      series: [{ id: 3, title: 'Project 52', slug: 'project-52' }],
      series_rails: [{ series: { id: 3, title: 'Project 52', slug: 'project-52' }, count: 1, items: [article({ id: 23, title: 'Series Resource', slug: 'series-resource' })] }],
    });
    mocks.searchPublicWritings.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [article()],
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('loads resource type browse results from the composed resource type endpoint', async () => {
    await renderBrowse(root, '/resources/type/devotional', '/resources/type/:slug', 'type');

    await vi.waitFor(() => expect(container.textContent).toContain('Grace for Today'));
    expect(container.textContent).toContain('Devotional');
    expect(container.textContent).toContain('Devotional resources for the church.');
    expect(container.textContent).toContain('Featured Devotional');
    expect(container.textContent).toContain('Latest Devotional');
    expect(container.textContent).toContain('Prayer Resource');
    expect(container.textContent).toContain('Series Resource');
    expect(container.textContent).toContain('Explore by Category');
    expect(container.textContent).toContain('Explore by Series');
    expect(container.querySelector('a[href="/resources/category/prayer"]')).not.toBeNull();
    expect(container.querySelector('a[href="/resources/series/project-52"]')).not.toBeNull();
    expect(mocks.fetchResourceTypeDetail).toHaveBeenCalledWith('devotional', { page: 1, pageSize: 24 }, expect.any(AbortSignal));
    expect(mocks.searchPublicWritings).not.toHaveBeenCalled();
  });

  it('loads category browse results with category_slug', async () => {
    await renderBrowse(root, '/resources/category/prayer', '/resources/category/:slug', 'category');

    await vi.waitFor(() => expect(container.textContent).toContain('Grace for Today'));
    expect(container.textContent).toContain('Prayer');
    expect(mocks.searchPublicWritings).toHaveBeenCalledWith({ category_slug: 'prayer', page: 1, page_size: 24 }, expect.any(AbortSignal));
  });

  it('loads series browse results with series_slug', async () => {
    await renderBrowse(root, '/resources/series/project-52', '/resources/series/:slug', 'series');

    await vi.waitFor(() => expect(container.textContent).toContain('Grace for Today'));
    expect(container.textContent).toContain('Project 52');
    expect(mocks.searchPublicWritings).toHaveBeenCalledWith({ series_slug: 'project-52', page: 1, page_size: 24 }, expect.any(AbortSignal));
  });

  it('loads scripture book browse results with scripture_book_osis', async () => {
    await renderBrowse(root, '/resources/book/Acts', '/resources/book/:osisId', 'book');

    await vi.waitFor(() => expect(container.textContent).toContain('Grace for Today'));
    expect(container.textContent).toContain('Acts');
    expect(mocks.searchPublicWritings).toHaveBeenCalledWith({ scripture_book_osis: 'Acts', page: 1, page_size: 24 }, expect.any(AbortSignal));
  });

  it('loads ministry browse results with ministry_slug', async () => {
    await renderBrowse(root, '/resources/ministry/youth', '/resources/ministry/:slug', 'ministry');

    await vi.waitFor(() => expect(container.textContent).toContain('Grace for Today'));
    expect(container.textContent).toContain('Youth');
    expect(mocks.searchPublicWritings).toHaveBeenCalledWith({ ministry_slug: 'youth', page: 1, page_size: 24 }, expect.any(AbortSignal));
  });

  it('shows load more from articles.next, then appends the next composed resource type page', async () => {
    mocks.fetchResourceTypeDetail
      .mockResolvedValueOnce({
        articles: { count: 2, next: '/v1/resources/type/devotional/?page=2&page_size=24', previous: null, results: [article({ id: 1, title: 'First Resource' })] },
        categories: [],
        category_rails: [],
        featured_articles: [],
        latest_articles: [],
        resource_type: { id: 1, name: 'Devotional', slug: 'devotional', description: 'Devotional resources.' },
        series: [],
        series_rails: [],
      })
      .mockResolvedValueOnce({
        articles: { count: 2, next: null, previous: '/v1/resources/type/devotional/?page=1&page_size=24', results: [article({ id: 2, title: 'Second Resource', slug: 'second-resource' })] },
        categories: [],
        category_rails: [],
        featured_articles: [],
        latest_articles: [],
        resource_type: { id: 1, name: 'Devotional', slug: 'devotional', description: 'Devotional resources.' },
        series: [],
        series_rails: [],
      });

    await renderBrowse(root, '/resources/type/devotional', '/resources/type/:slug', 'type');
    await vi.waitFor(() => expect(container.textContent).toContain('First Resource'));

    const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.includes('Load more')) as HTMLButtonElement;
    expect(button).toBeTruthy();
    await act(async () => button.click());

    await vi.waitFor(() => expect(container.textContent).toContain('Second Resource'));
    expect(container.textContent).toContain('First Resource');
    expect(mocks.fetchResourceTypeDetail).toHaveBeenLastCalledWith('devotional', { page: 2, pageSize: 24 }, undefined);
  });

  it('shows a skeleton grid while browse results are loading', async () => {
    mocks.fetchResourceTypeDetail.mockReturnValueOnce(new Promise(() => undefined));

    await renderBrowse(root, '/resources/type/devotional', '/resources/type/:slug', 'type');

    expect(container.textContent).toContain('Loading resources');
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('shows an intentional empty state when browse results are empty', async () => {
    mocks.fetchResourceTypeDetail.mockResolvedValueOnce({ articles: { count: 0, next: null, previous: null, results: [] }, categories: [], category_rails: [], featured_articles: [], latest_articles: [], resource_type: { id: 1, name: 'Devotional', slug: 'devotional', description: '' }, series: [], series_rails: [] });

    await renderBrowse(root, '/resources/type/devotional', '/resources/type/:slug', 'type');

    await vi.waitFor(() => expect(container.textContent).toContain('No published resources here yet.'));
    expect(container.textContent).toContain('Once published writings are connected to this part of the library, they will appear here.');
  });

  it('shows a graceful error when browse results fail to load', async () => {
    mocks.fetchResourceTypeDetail.mockRejectedValueOnce(new Error('Nope'));

    await renderBrowse(root, '/resources/type/devotional', '/resources/type/:slug', 'type');

    await vi.waitFor(() => expect(container.textContent).toContain('Unable to load these resources right now.'));
  });

});
