// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResourcesPage from '../../src/pages/ResourcesPage';

const mocks = vi.hoisted(() => ({
  fetchResourcesHome: vi.fn(),
  fetchResourcesNavigation: vi.fn(),
}));

vi.mock('../../src/hooks/useTheme', () => ({
  useTheme: () => ({ darkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock('../../src/components/SiteHeader', () => ({
  default: () => <header>Site Header</header>,
}));

vi.mock('../../src/components/SiteFooter', () => ({
  default: () => <footer>Site Footer</footer>,
}));

vi.mock('../../src/services/resourcesApi', () => ({
  fetchResourcesHome: mocks.fetchResourcesHome,
  fetchResourcesNavigation: mocks.fetchResourcesNavigation,
}));

const renderPage = async (root: Root) => {
  await act(async () => {
    root.render(<ResourcesPage />);
    await Promise.resolve();
  });
};

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
  resource_type_detail: { id: 1, name: 'Devotional', slug: 'devotional', description: '', is_active: true, is_featured: true, sort_order: 0, writing_count: 2 },
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

describe('ResourcesPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mocks.fetchResourcesHome.mockReset();
    mocks.fetchResourcesNavigation.mockReset();
    mocks.fetchResourcesHome.mockResolvedValue({
      category_rails: [
        {
          category: { id: 31, name: 'Prayer', slug: 'prayer', description: '', parent: null, is_active: true, is_featured: true, sort_order: 0, writing_count: 3 },
          count: 3,
          items: [article({ id: 22, title: 'Rail Prayer', slug: 'rail-prayer' })],
        },
      ],
      featured_articles: [article({ id: 11, title: 'Featured Mercy', slug: 'featured-mercy' })],
      featured_categories: [
        { children: [], description: 'Life group studies.', id: 32, is_active: true, is_featured: true, name: 'Life Group Material', parent: null, slug: 'life-group-material', sort_order: 0, writing_count: 5 },
      ],
      featured_series: [{ description: 'A year in the Word.', id: 4, slug: 'project-52', title: 'Project 52', writing_count: 52 }],
      hero_featured: article({ title: 'Hero Resource' }),
      latest_articles: [article({ id: 12, title: 'Latest Grace', slug: 'latest-grace' })],
      ministries: [{ id: 3, name: 'Youth Ministry', slug: 'youth', summary: 'Youth resources', writing_count: 7 }],
      resource_type_rails: [
        {
          count: 2,
          items: [article({ id: 21, title: 'Rail Devotion', slug: 'rail-devotion' })],
          resource_type: { id: 1, name: 'Devotional', slug: 'devotional', description: '', is_active: true, is_featured: true, sort_order: 0, writing_count: 2 },
        },
      ],
      resource_types: [{ id: 1, name: 'Devotional', slug: 'devotional', description: '', is_active: true, is_featured: true, sort_order: 0, writing_count: 2 }],
      scripture_books: [{ abbreviation: 'Ps', id: 19, name: 'Psalms', number: 19, osis_id: 'Ps', testament: 'OT', writing_count: 8 }],
      series_rails: [
        {
          count: 52,
          items: [article({ id: 23, title: 'Rail Project 52', slug: 'rail-project-52' })],
          series: { cover_image_detail: null, description: 'A year in the Word.', id: 4, slug: 'project-52', title: 'Project 52', writing_count: 52 },
        },
      ],
    });
    mocks.fetchResourcesNavigation.mockResolvedValue({
      categories: [],
      category_series_links: [],
      ministries: [{ id: 3, name: 'Youth Ministry', slug: 'youth', summary: 'Youth resources', writing_count: 7 }],
      resource_type_category_links: [],
      resource_types: [
        { id: 1, name: 'Devotional', slug: 'devotional', description: '', is_active: true, is_featured: true, sort_order: 0, writing_count: 2 },
        { id: 2, name: 'Bible Study', slug: 'bible-study', description: '', is_active: true, is_featured: false, sort_order: 1, writing_count: 4 },
      ],
      scripture_books: [{ abbreviation: 'Ps', id: 19, name: 'Psalms', number: 19, osis_id: 'Ps', testament: 'OT', writing_count: 8 }],
      series: [{ description: 'A year in the Word.', id: 4, slug: 'project-52', title: 'Project 52', writing_count: 52 }],
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('loads public resources home and navigation, then renders backend-powered sections', async () => {
    await renderPage(root);

    await vi.waitFor(() => expect(container.textContent).toContain('Latest Grace'));

    expect(mocks.fetchResourcesHome).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(mocks.fetchResourcesNavigation).toHaveBeenCalledWith({}, expect.any(AbortSignal));
    expect(container.textContent).toContain('All');
    expect(container.querySelector('a[href="/resources"]')).not.toBeNull();
    expect(container.textContent).toContain('Devotional');
    expect(container.textContent).toContain('Bible Study');
    expect(container.querySelector('a[href="/resources/type/bible-study"]')).not.toBeNull();
    expect(container.textContent).toContain('Featured Mercy');
    expect(container.textContent).toContain('Curated Shelf');
    expect(container.textContent).toContain('3 featured');
    expect(container.querySelector('[data-resources-featured-shelf="true"]')).not.toBeNull();
    expect(container.textContent).toContain('Featured Article');
    expect(container.textContent).toContain('Featured Collection');
    expect(container.textContent).toContain('Life Group Material');
    expect(container.querySelector('a[href="/resources/category/life-group-material"]')).not.toBeNull();
    expect(container.textContent).toContain('Featured Series');
    expect(container.textContent).toContain('Explore by Resource Type');
    expect(container.textContent).toContain('Rail Devotion');
    expect(container.textContent).toContain('View more Devotional');
    expect(container.querySelector('a[href="/resources/type/devotional"]')).not.toBeNull();
    expect(container.querySelector('[data-resources-taxonomy-shelf="resource-type"]')).not.toBeNull();
    expect(container.querySelector('[data-resources-article-shelf="true"]')).not.toBeNull();
    expect(container.textContent).toContain('Explore by Category');
    expect(container.textContent).toContain('Rail Prayer');
    expect(container.textContent).toContain('View more Prayer');
    expect(container.querySelector('a[href="/resources/category/prayer"]')).not.toBeNull();
    expect(container.querySelector('[data-resources-taxonomy-shelf="category"]')).not.toBeNull();
    expect(container.textContent).toContain('Explore by Series');
    expect(container.textContent).toContain('Rail Project 52');
    expect(container.textContent).toContain('View more Project 52');
    expect(container.querySelector('a[href="/resources/series/project-52"]')).not.toBeNull();
    expect(container.querySelector('[data-resources-taxonomy-shelf="series"]')).not.toBeNull();
    expect(container.textContent).toContain('Project 52');
    expect(container.textContent).toContain('Psalms');
    expect(container.textContent).toContain('Youth Ministry');
    expect(container.textContent).toContain('Latest Publication');
    expect(container.textContent).toContain('Latest Grace');
    expect(container.textContent).toContain('Hero Resource');
    expect(container.querySelector('[data-resource-card-cover="editorial"]')).not.toBeNull();
  });


  it('shows landing skeletons while public resources are loading', async () => {
    mocks.fetchResourcesHome.mockReturnValueOnce(new Promise(() => undefined));
    mocks.fetchResourcesNavigation.mockReturnValueOnce(new Promise(() => undefined));

    await renderPage(root);

    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('uses the latest article as the hero publication', async () => {
    mocks.fetchResourcesHome.mockResolvedValueOnce({
      featured_articles: [],
      featured_categories: [],
      featured_series: [],
      hero_featured: null,
      latest_articles: [article({ id: 44, slug: 'latest-stand-in', title: 'Latest Stand In' })],
      ministries: [],
      resource_type_rails: [],
      resource_types: [],
      scripture_books: [],
    });

    await renderPage(root);

    await vi.waitFor(() => expect(container.textContent).toContain('Latest Stand In'));
    expect(container.textContent).toContain('Latest Publication');
    expect(container.textContent).not.toContain('No latest publication yet.');
  });

  it('omits public Featured, Scripture, and Ministry sections when their data is empty', async () => {
    mocks.fetchResourcesHome.mockResolvedValueOnce({
      category_rails: [],
      featured_articles: [],
      featured_categories: [],
      featured_series: [],
      hero_featured: null,
      latest_articles: [],
      ministries: [],
      resource_type_rails: [],
      resource_types: [],
      scripture_books: [],
      series_rails: [],
    });
    mocks.fetchResourcesNavigation.mockResolvedValueOnce({
      categories: [],
      category_series_links: [],
      ministries: [],
      resource_type_category_links: [],
      resource_types: [],
      scripture_books: [],
      series: [],
    });

    await renderPage(root);

    await vi.waitFor(() => expect(container.textContent).toContain('No latest publication yet.'));
    expect(container.textContent).not.toContain('Featured resources will appear here once they are curated.');
    expect(container.textContent).not.toContain('Featured Collections');
    expect(container.textContent).not.toContain('Browse Scripture');
    expect(container.textContent).not.toContain('Browse Ministry');
  });

  it('shows a graceful error when public resources fail to load', async () => {
    mocks.fetchResourcesHome.mockRejectedValueOnce(new Error('Nope'));

    await renderPage(root);

    await vi.waitFor(() => expect(container.textContent).toContain('Unable to load the resources library right now.'));
  });
});




