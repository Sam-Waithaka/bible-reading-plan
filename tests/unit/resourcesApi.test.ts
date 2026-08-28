import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../src/services/apiClient';
import { clearApiClientCaches } from '../../src/services/apiClient';
import { fetchPublicResourceDetail, fetchResourcesHome, fetchResourcesNavigation, fetchResourceTypeDetail, normalizeResourceTypeDetail, normalizeResourcesHome, normalizeResourcesNavigation } from '../../src/services/resourcesApi';

const jsonResponse = (payload: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
    ...init,
  });

describe('resourcesApi', () => {
  beforeEach(() => {
    clearApiClientCaches();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearApiClientCaches();
    vi.unstubAllGlobals();
  });

  it('normalizes navigation payloads with optional curation links', () => {
    expect(normalizeResourcesNavigation({
      categories: [{ id: 1, name: 'Proverbs' }],
      category_series_links: [{ id: 2, category: 1, series: 4 }],
      ministries: [{ id: 3, name: 'Youth', writing_count: 5 }],
      resource_type_category_links: [{ id: 5, resource_type: 8, category: 1 }],
      resource_types: [{ id: 8, name: 'Bible Study' }],
      scripture_books: [{ osis_id: 'Prov', name: 'Proverbs', writing_count: 30 }],
      series: [{ id: 4, title: 'Proverbs Lessons' }],
    })).toMatchObject({
      categories: [{ name: 'Proverbs' }],
      category_series_links: [{ category: 1, series: 4 }],
      resource_type_category_links: [{ resource_type: 8, category: 1 }],
      series: [{ title: 'Proverbs Lessons' }],
    });
  });

  it('normalizes resources home payloads for the public landing page', () => {
    expect(normalizeResourcesHome({
      hero_featured: { id: 10, title: 'Grace for Today' },
      featured_articles: [{ id: 11, title: 'Featured' }],
      resource_types: [{ id: 1, name: 'Devotional' }],
      featured_series: [{ id: 2, title: 'Project 52' }],
      latest_articles: [{ id: 12, title: 'Latest' }],
      scripture_books: [{ osis_id: 'Ps', name: 'Psalms' }],
      ministries: [{ id: 3, name: 'Youth' }],
    })).toMatchObject({
      hero_featured: { title: 'Grace for Today' },
      featured_articles: [{ title: 'Featured' }],
      resource_types: [{ name: 'Devotional' }],
      featured_series: [{ title: 'Project 52' }],
      latest_articles: [{ title: 'Latest' }],
      scripture_books: [{ name: 'Psalms' }],
      ministries: [{ name: 'Youth' }],
    });
  });

  it('fetches resources home without auth headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      hero_featured: { id: 10, title: 'Grace for Today' },
      latest_articles: [{ id: 12, title: 'Latest' }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchResourcesHome()).resolves.toMatchObject({
      hero_featured: { title: 'Grace for Today' },
      latest_articles: [{ title: 'Latest' }],
    });

    expect(fetchMock).toHaveBeenCalledWith('/v1/resources/home/', expect.objectContaining({
      headers: { Accept: 'application/json' },
    }));
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('reuses the memory-cached Resources Home response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ latest_articles: [{ id: 12, title: 'Latest' }] }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchResourcesHome();
    await fetchResourcesHome();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps Navigation query combinations as independent cache entries', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ resource_types: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchResourcesNavigation({ category_slug: 'leadership' });
    await fetchResourcesNavigation({ resource_type_slug: 'insights' });
    await fetchResourcesNavigation({ category_slug: 'leadership' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/v1/resources/navigation/?category_slug=leadership', expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/resources/navigation/?resource_type_slug=insights', expect.any(Object));
  });

  it('normalizes resource type detail payloads for focused tab views', () => {
    expect(normalizeResourceTypeDetail({
      resource_type: { id: 1, name: 'Bible Study', slug: 'bible-study' },
      featured_articles: [{ id: 10, title: 'Featured Study' }],
      latest_articles: [{ id: 11, title: 'Latest Study' }],
      categories: [{ id: 2, name: 'Life Group Material' }],
      series: [{ id: 3, title: 'Proverbs' }],
      category_rails: [{ category: { id: 2, name: 'Life Group Material' }, count: 1, items: [] }],
      series_rails: [{ series: { id: 3, title: 'Proverbs' }, count: 1, items: [] }],
      articles: { count: 2, next: '/v1/resources/type/bible-study/?page=2&page_size=24', previous: null, results: [{ id: 12, title: 'Article' }] },
    })).toMatchObject({
      resource_type: { name: 'Bible Study' },
      featured_articles: [{ title: 'Featured Study' }],
      latest_articles: [{ title: 'Latest Study' }],
      categories: [{ name: 'Life Group Material' }],
      series: [{ title: 'Proverbs' }],
      category_rails: [{ count: 1 }],
      series_rails: [{ count: 1 }],
      articles: { count: 2, next: '/v1/resources/type/bible-study/?page=2&page_size=24', results: [{ title: 'Article' }] },
    });
  });

  it('fetches resource type detail without auth headers and with pagination params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      resource_type: { id: 1, name: 'Bible Study', slug: 'bible-study' },
      articles: { count: 1, next: null, previous: null, results: [{ id: 12, title: 'Article' }] },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchResourceTypeDetail('bible-study', { page: 2, pageSize: 12 })).resolves.toMatchObject({
      resource_type: { name: 'Bible Study' },
      articles: { count: 1, results: [{ title: 'Article' }] },
    });

    expect(fetchMock).toHaveBeenCalledWith('/v1/resources/type/bible-study/?page=2&page_size=12', expect.objectContaining({
      headers: { Accept: 'application/json' },
    }));
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('memory-caches resource type detail while keeping encoded slugs and pages distinct', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({
      resource_type: { id: 1, name: 'Bible Study', slug: 'bible-study' },
      articles: { count: 0, next: null, previous: null, results: [] },
    })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchResourceTypeDetail('Bible study/notes', { page: 1, pageSize: 24 });
    await fetchResourceTypeDetail('Bible study/notes', { page: 1, pageSize: 24 });
    await fetchResourceTypeDetail('Bible study/notes', { page: 2, pageSize: 24 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/v1/resources/type/Bible%20study%2Fnotes/?page=1&page_size=24', expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/resources/type/Bible%20study%2Fnotes/?page=2&page_size=24', expect.any(Object));
  });

  it('fetches public resource detail by slug and optional published_at without auth headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      id: 4,
      slug: 'grace-for-today',
      title: 'Grace for Today',
      content_html: '<p>Amen.</p>',
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPublicResourceDetail('grace-for-today', '2026-07-17T09:00:00Z')).resolves.toMatchObject({
      title: 'Grace for Today',
      content_html: '<p>Amen.</p>',
    });

    expect(fetchMock).toHaveBeenCalledWith('/v1/resources/grace-for-today/?published_at=2026-07-17T09%3A00%3A00Z', expect.objectContaining({
      headers: { Accept: 'application/json' },
    }));
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('memory-caches public resource detail with each public publication timestamp as a separate key', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({
      id: 4,
      slug: 'grace/for-today',
      title: 'Grace for Today',
    })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchPublicResourceDetail('grace/for-today', '2026-07-17T09:00:00Z');
    await fetchPublicResourceDetail('grace/for-today', '2026-07-17T09:00:00Z');
    await fetchPublicResourceDetail('grace/for-today', '2026-07-18T09:00:00Z');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/v1/resources/grace%2Ffor-today/?published_at=2026-07-17T09%3A00%3A00Z', expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/v1/resources/grace%2Ffor-today/?published_at=2026-07-18T09%3A00%3A00Z', expect.any(Object));
  });

  it('fetches narrowed resources navigation without auth headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      categories: [{ id: 1, name: 'Proverbs' }],
      series: [{ id: 2, title: 'Proverbs Lessons' }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchResourcesNavigation({
      category_slug: 'proverbs',
      resource_type_slug: 'bible-study',
    })).resolves.toMatchObject({
      categories: [{ name: 'Proverbs' }],
      series: [{ title: 'Proverbs Lessons' }],
    });

    expect(fetchMock).toHaveBeenCalledWith('/v1/resources/navigation/?category_slug=proverbs&resource_type_slug=bible-study', expect.objectContaining({
      headers: { Accept: 'application/json' },
    }));
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('preserves resources navigation error detail and status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ detail: 'Bad filter.' }, { status: 400 }))));

    await expect(fetchResourcesNavigation({ resource_type_slug: 'missing' })).rejects.toBeInstanceOf(ApiError);
    await expect(fetchResourcesNavigation({ resource_type_slug: 'missing' })).rejects.toMatchObject({
      detail: 'Bad filter.',
      status: 400,
    });
  });
});
