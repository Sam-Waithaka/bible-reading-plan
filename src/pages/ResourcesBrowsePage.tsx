import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ResourceMasonry from '../components/resources/ResourceMasonry';
import ResourcesContainer from '../components/resources/ResourcesContainer';
import SiteFooter from '../components/navigation/SiteFooter';
import SiteHeader from '../components/navigation/SiteHeader';
import { discoveryGridColumnsClass } from '../constants/responsive';
import { useTheme } from '../hooks/useTheme';
import { searchPublicWritings, type PublicSearchQuery } from '../services/publicSearchApi';
import { fetchResourceTypeDetail } from '../services/resourcesApi';
import type { PaginatedResponse, PublicResourceTypeDetail, PublicWritingCard } from '../types/writing';

type BrowseMode = 'book' | 'category' | 'ministry' | 'series' | 'type';

type RouteParams = {
  osisId?: string;
  slug?: string;
};

const titleCase = (value = '') => value
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const resolveBrowseConfig = (mode: BrowseMode, params: RouteParams): { description: string; filter: PublicSearchQuery; label: string; title: string } => {
  if (mode === 'type') {
    const slug = params.slug || '';
    return {
      description: 'Published resources grouped under this resource type.',
      filter: { resource_type_slug: slug },
      label: 'Resource Type',
      title: titleCase(slug),
    };
  }
  if (mode === 'category') {
    const slug = params.slug || '';
    return {
      description: 'Published resources grouped under this category.',
      filter: { category_slug: slug },
      label: 'Category',
      title: titleCase(slug),
    };
  }
  if (mode === 'series') {
    const slug = params.slug || '';
    return {
      description: 'A curated collection of published writings from the church library.',
      filter: { series_slug: slug },
      label: 'Series',
      title: titleCase(slug),
    };
  }
  if (mode === 'book') {
    const osisId = params.osisId || '';
    return {
      description: 'Published writings that reference this book of Scripture.',
      filter: { scripture_book_osis: osisId },
      label: 'Scripture',
      title: titleCase(osisId),
    };
  }
  const slug = params.slug || '';
  return {
    description: 'Published writings connected to this ministry.',
    filter: { ministry_slug: slug },
    label: 'Ministry',
    title: titleCase(slug),
  };
};

const SectionHeading = ({ title }: { title: string }) => (
  <div className="flex items-center gap-4">
    <div className="h-px flex-1 bg-[#eaded0] dark:bg-white/10" />
    <h2 className="shrink-0 text-center text-sm font-black uppercase tracking-[0.16em] text-zinc-950 dark:text-stone-100">{title}</h2>
    <div className="h-px flex-1 bg-[#eaded0] dark:bg-white/10" />
  </div>
);

const SkeletonGrid = () => (
  <div className={`grid min-w-0 ${discoveryGridColumnsClass} gap-5`}>
    {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-black/10 bg-white/70 shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:bg-[#171717]" />)}
  </div>
);

const ResourcesBrowsePage = ({ mode }: { mode: BrowseMode }) => {
  const params = useParams<RouteParams>();
  const { darkMode, toggleTheme } = useTheme();
  const config = useMemo(() => resolveBrowseConfig(mode, params), [mode, params]);
  const [resourceTypeDetail, setResourceTypeDetail] = useState<PublicResourceTypeDetail | null>(null);
  const [items, setItems] = useState<PublicWritingCard[]>([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadPage = useCallback(async (page: number, append = false, signal?: AbortSignal) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    try {
      let response: PaginatedResponse<PublicWritingCard>;

      if (mode === 'type') {
        const detail = await fetchResourceTypeDetail(params.slug || '', { page, pageSize: 24 }, signal);
        response = detail.articles;
        setResourceTypeDetail((current) => append && current ? { ...detail, articles: { ...detail.articles, results: [...current.articles.results, ...detail.articles.results] } } : detail);
      } else {
        response = await searchPublicWritings({ ...config.filter, page, page_size: 24 }, signal);
        if (!append) setResourceTypeDetail(null);
      }

      setItems((current) => append ? [...current, ...response.results] : response.results);
      setCount(response.count ?? response.results.length);
      setNextPage(response.next ?? null);
      setCurrentPage(page);
    } catch (err) {
      if (signal?.aborted || err instanceof DOMException && err.name === 'AbortError') return;
      setError('Unable to load these resources right now. Please try again shortly.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [config.filter, mode, params.slug]);

  useEffect(() => {
    const controller = new AbortController();
    void loadPage(1, false, controller.signal);
    return () => controller.abort();
  }, [loadPage]);

  const pageTitle = mode === 'type' && resourceTypeDetail?.resource_type.name ? resourceTypeDetail.resource_type.name : config.title;
  const pageDescription = mode === 'type' && resourceTypeDetail?.resource_type.description ? resourceTypeDetail.resource_type.description : config.description;
  const categoryChips = resourceTypeDetail?.categories ?? [];
  const seriesChips = resourceTypeDetail?.series ?? [];

  return (
    <div className={`flex min-h-screen flex-col overflow-x-clip transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <SiteHeader darkMode={darkMode} onToggleTheme={toggleTheme} />
      <main className={`flex-1 ${darkMode ? 'bg-[#080808]' : 'bg-[linear-gradient(180deg,#f8f5ef,#fffaf0_42%,#f8f5ef)]'}`}>
        <section className="border-b border-black/10 py-14 dark:border-white/10">
          <ResourcesContainer>
            <Link to="/resources" className="inline-flex items-center gap-2 text-sm font-black text-red-800 transition hover:text-red-700 dark:text-red-100">
              <ArrowLeft size={16} aria-hidden="true" /> Back to Resources
            </Link>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.16em] text-red-700 dark:text-red-200">{config.label}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl font-bold leading-tight tracking-normal text-zinc-950 dark:text-stone-100 sm:text-6xl">{pageTitle}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-700 dark:text-stone-300">{pageDescription}</p>
            {mode === 'type' && (categoryChips.length || seriesChips.length) ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {categoryChips.map((category) => (
                  <Link className="rounded-full border border-[#eaded0] bg-white/75 px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-white hover:text-red-800 dark:border-white/10 dark:bg-zinc-950 dark:text-stone-300 dark:hover:text-red-100" key={`category-${category.id}`} to={`/resources/category/${category.slug}`}>
                    {category.name}
                  </Link>
                ))}
                {seriesChips.map((series) => (
                  <Link className="rounded-full border border-[#eaded0] bg-white/75 px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-white hover:text-red-800 dark:border-white/10 dark:bg-zinc-950 dark:text-stone-300 dark:hover:text-red-100" key={`series-${series.id}`} to={`/resources/series/${series.slug}`}>
                    {series.title}
                  </Link>
                ))}
              </div>
            ) : null}
          </ResourcesContainer>
        </section>

        <ResourcesContainer className="grid gap-10 py-10">
          {error ? <div className="rounded-2xl border border-red-900/15 bg-red-50 p-5 text-sm font-bold text-red-800 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-100">{error}</div> : null}
          {loading ? (
            <section className="grid gap-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-800 dark:text-red-200">Loading resources</p>
              <SkeletonGrid />
            </section>
          ) : null}

          {!loading && resourceTypeDetail?.featured_articles.length ? (
            <section className="grid gap-5">
              <SectionHeading title="Featured" />
              <ResourceMasonry articles={resourceTypeDetail.featured_articles} shelf="type-featured" />
            </section>
          ) : null}

          {!loading && resourceTypeDetail?.latest_articles.length ? (
            <section className="grid gap-5">
              <SectionHeading title="Latest" />
              <ResourceMasonry articles={resourceTypeDetail.latest_articles} shelf="type-latest" />
            </section>
          ) : null}

          {!loading && resourceTypeDetail?.category_rails.length ? (
            <section className="grid gap-6">
              <SectionHeading title="Explore by Category" />
              {resourceTypeDetail.category_rails.map((rail) => (
                <div className="rounded-[1.65rem] border border-[#eaded0] bg-[#fffaf0] p-5 shadow-xl shadow-zinc-900/5 dark:border-white/10 dark:bg-[#171717] dark:shadow-black/35" key={rail.category.id}>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-red-800 dark:text-red-200">{rail.category.name}</h3>
                      <p className="mt-2 text-sm text-zinc-700 dark:text-stone-300">{rail.count} {rail.count === 1 ? 'Article' : 'Articles'} available</p>
                    </div>
                    <Link className="inline-flex items-center gap-2 rounded-full border border-[#eaded0] bg-white px-4 py-2 text-sm font-black text-red-800 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-zinc-950 dark:text-red-100" to={`/resources/category/${rail.category.slug}`}>
                      View more {rail.category.name}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                  <ResourceMasonry articles={rail.items} shelf="type-category-rail" />
                </div>
              ))}
            </section>
          ) : null}

          {!loading && resourceTypeDetail?.series_rails.length ? (
            <section className="grid gap-6">
              <SectionHeading title="Explore by Series" />
              {resourceTypeDetail.series_rails.map((rail) => (
                <div className="rounded-[1.65rem] border border-[#eaded0] bg-[#fffaf0] p-5 shadow-xl shadow-zinc-900/5 dark:border-white/10 dark:bg-[#171717] dark:shadow-black/35" key={rail.series.id}>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-red-800 dark:text-red-200">{rail.series.title}</h3>
                      <p className="mt-2 text-sm text-zinc-700 dark:text-stone-300">{rail.count} {rail.count === 1 ? 'Article' : 'Articles'} available</p>
                    </div>
                    <Link className="inline-flex items-center gap-2 rounded-full border border-[#eaded0] bg-white px-4 py-2 text-sm font-black text-red-800 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-zinc-950 dark:text-red-100" to={`/resources/series/${rail.series.slug}`}>
                      View more {rail.series.title}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                  <ResourceMasonry articles={rail.items} shelf="type-series-rail" />
                </div>
              ))}
            </section>
          ) : null}

          {!loading ? (
            <section className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-800 dark:text-red-200">{count} {count === 1 ? 'Resource' : 'Resources'}</p>
              </div>
              {items.length ? <ResourceMasonry articles={items} shelf="browse-results" /> : (
                <div className="rounded-2xl border border-black/10 bg-white/70 p-8 text-center shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:bg-[#171717]">
                  <h2 className="font-serif text-3xl font-bold">No published resources here yet.</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-stone-400">Once published writings are connected to this part of the library, they will appear here.</p>
                </div>
              )}
            </section>
          ) : null}

          {nextPage ? (
            <div className="flex justify-center pt-2">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-red-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 disabled:opacity-50"
                disabled={loadingMore}
                onClick={() => void loadPage(currentPage + 1, true)}
                type="button"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </ResourcesContainer>
      </main>
      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default ResourcesBrowsePage;
