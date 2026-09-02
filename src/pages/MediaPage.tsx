import { useEffect, useMemo, useRef, useState } from 'react';
import MediaCallout from '../components/media/MediaCallout';
import MediaCategoryTabs from '../components/media/MediaCategoryTabs';
import type { MediaTabKey } from '../components/media/MediaCategoryTabs';
import MediaFeatured from '../components/media/MediaFeatured';
import MediaHero from '../components/media/MediaHero';
import MediaRail from '../components/media/MediaRail';
import MediaSeriesDetail from '../components/media/MediaSeriesDetail';
import MediaSeriesRail from '../components/media/MediaSeriesRail';
import MusicSubcategoryTabs from '../components/media/MusicSubcategoryTabs';
import type { MusicSubcategoryKey } from '../components/media/MusicSubcategoryTabs';
import { fallbackMediaHome } from '../components/media/mediaContent';
import { selectMediaHeroItem } from '../components/media/mediaHeroSelection';
import SiteFooter from '../components/navigation/SiteFooter';
import SiteHeader from '../components/navigation/SiteHeader';
import { useTheme } from '../hooks/useTheme';
import {
  fetchAudioVisualHome,
  fetchAudioVisualItemPage,
  fetchAudioVisualItems,
  fetchAudioVisualRails,
  fetchAudioVisualSeries,
  fetchAudioVisualSeriesDetail,
  fetchFeaturedAudioVisualItems,
  fetchLatestSermon,
  fetchLiveAudioVisualCta,
} from '../services/audioVisualApi';
import type { AudioVisualGroupDetail, AudioVisualHomePayload, AudioVisualItem, AudioVisualLookup, AudioVisualRail } from '../types/audioVisual';

type PagedMediaKey = Extract<MediaTabKey, 'explore' | 'featured' | 'livestreams' | 'sermons' | 'shorts' | 'teachings'>;

type PagedMediaState = {
  count: number;
  items: AudioVisualItem[];
  page: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
};

const PAGE_SIZE = 20;

const emptyPagedState = (): PagedMediaState => ({
  count: 0,
  items: [],
  page: 0,
  status: 'idle',
});

const isPagedMediaTab = (tab: MediaTabKey): tab is PagedMediaKey =>
  ['explore', 'featured', 'livestreams', 'sermons', 'shorts', 'teachings'].includes(tab);

const pagedQueryForTab = (tab: PagedMediaKey) => {
  switch (tab) {
    case 'explore':
      return { type: 'other', ordering: 'latest' as const };
    case 'featured':
      return { featured: true, ordering: 'latest' as const };
    case 'livestreams':
      return { type: 'livestream', ordering: 'latest' as const };
    case 'sermons':
      return { type: 'sermon', ordering: 'latest' as const };
    case 'shorts':
      return { type: 'short', ordering: 'latest' as const };
    case 'teachings':
      return { type: 'teaching', ordering: 'latest' as const };
  }
};

const musicSubcategoryQuery = (subcategory: MusicSubcategoryKey) => ({
  type: 'music',
  ordering: 'latest' as const,
  ...(subcategory === 'all' ? {} : { musicSubcategory: subcategory }),
});

const musicSubcategoryTitle = (subcategory: MusicSubcategoryKey) =>
  subcategory === 'all' ? 'Music' : subcategory === 'pnw' ? 'Praise and Worship' : subcategory === 'choir' ? 'Choir' : 'Explore Music';

const mergeMediaItems = (current: AudioVisualItem[], next: AudioVisualItem[]) => {
  const seen = new Set(current.map((item) => item.slug));
  return [...current, ...next.filter((item) => !seen.has(item.slug))];
};

const getPreviewCounts = () => {
  if (typeof window === 'undefined') {
    return { livestreams: 8, music: 8, sermons: 12, shorts: 6 };
  }

  const width = window.innerWidth;

  if (width >= 1280) {
    return { livestreams: 8, music: 8, sermons: 12, shorts: 5 };
  }

  if (width >= 1024) {
    return { livestreams: 6, music: 6, sermons: 9, shorts: 5 };
  }

  if (width >= 640) {
    return { livestreams: 4, music: 4, sermons: 6, shorts: 6 };
  }

  return { livestreams: 2, music: 2, sermons: 6, shorts: 6 };
};

const mergeRail = (rail: AudioVisualRail | undefined, fallback: AudioVisualRail, endpointItems: AudioVisualItem[] = [], useFallback = false) => {
  if (rail && rail.items.length > 0) {
    return rail;
  }

  if (endpointItems.length > 0) {
    return { ...fallback, items: endpointItems };
  }

  return useFallback ? fallback : { ...fallback, items: [] };
};

const fallbackSeries = () => {
  const seriesMap = new Map<string, AudioVisualLookup>();

  fallbackMediaHome.rails
    .flatMap((rail) => rail.items)
    .forEach((item) => {
      if (item.series?.name) {
        seriesMap.set(item.series.slug || item.series.name, item.series);
      }
    });

  return Array.from(seriesMap.values());
};

const hydrateSeriesThumbnails = async (series: AudioVisualLookup[], signal: AbortSignal) => {
  const visibleSeries = series.slice(0, 10);
  const hydratedEntries = await Promise.allSettled(
    visibleSeries.map(async (item) => {
      if (item.thumbnailUrl || !item.slug) {
        return item;
      }

      const detail = await fetchAudioVisualSeriesDetail(item.slug, signal);
      const fallbackThumbnail = detail.items.find((video) => video.thumbnailUrl)?.thumbnailUrl;

      return fallbackThumbnail ? { ...item, thumbnailUrl: fallbackThumbnail } : item;
    })
  );

  const hydratedBySlug = new Map<string, AudioVisualLookup>();
  hydratedEntries.forEach((entry) => {
    if (entry.status === 'fulfilled') {
      hydratedBySlug.set(entry.value.slug || entry.value.name, entry.value);
    }
  });

  return series.map((item) => hydratedBySlug.get(item.slug || item.name) || item);
};

const MediaPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [homePayload, setHomePayload] = useState<AudioVisualHomePayload>(fallbackMediaHome);
  const [latestSermon, setLatestSermon] = useState<AudioVisualItem | null>(null);
  const [endpointRails, setEndpointRails] = useState<AudioVisualRail[]>([]);
  const [featuredItems, setFeaturedItems] = useState<AudioVisualItem[]>([]);
  const [exploreItems, setExploreItems] = useState<AudioVisualItem[]>([]);
  const [livestreamItems, setLivestreamItems] = useState<AudioVisualItem[]>([]);
  const [musicItems, setMusicItems] = useState<AudioVisualItem[]>([]);
  const [sermonItems, setSermonItems] = useState<AudioVisualItem[]>([]);
  const [seriesItems, setSeriesItems] = useState<AudioVisualLookup[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<AudioVisualLookup | null>(null);
  const [selectedSeriesDetail, setSelectedSeriesDetail] = useState<AudioVisualGroupDetail | null>(null);
  const [selectedSeriesStatus, setSelectedSeriesStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [shortItems, setShortItems] = useState<AudioVisualItem[]>([]);
  const [teachingItems, setTeachingItems] = useState<AudioVisualItem[]>([]);
  const [activeMusicSubcategory, setActiveMusicSubcategory] = useState<MusicSubcategoryKey>('all');
  const musicRequestsInFlight = useRef(new Set<MusicSubcategoryKey>());
  const [musicPagedMedia, setMusicPagedMedia] = useState<Record<MusicSubcategoryKey, PagedMediaState>>({
    all: emptyPagedState(),
    choir: emptyPagedState(),
    other: emptyPagedState(),
    pnw: emptyPagedState(),
  });
  const [activeTab, setActiveTab] = useState<MediaTabKey>('all');
  const [previewCounts, setPreviewCounts] = useState(getPreviewCounts);
  const [pagedMedia, setPagedMedia] = useState<Record<PagedMediaKey, PagedMediaState>>({
    explore: emptyPagedState(),
    featured: emptyPagedState(),
    livestreams: emptyPagedState(),
    sermons: emptyPagedState(),
    shorts: emptyPagedState(),
    teachings: emptyPagedState(),
  });
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    const handleResize = () => setPreviewCounts(getPreviewCounts());

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    Promise.allSettled([
      fetchAudioVisualHome(controller.signal),
      fetchAudioVisualRails(controller.signal),
      fetchLiveAudioVisualCta(controller.signal),
      fetchLatestSermon(controller.signal),
      fetchFeaturedAudioVisualItems(controller.signal),
      fetchAudioVisualItems({ type: 'livestream', ordering: 'latest' }, controller.signal),
      fetchAudioVisualItems({ type: 'music', ordering: 'latest' }, controller.signal),
      fetchAudioVisualItems({ type: 'sermon', ordering: 'latest' }, controller.signal),
      fetchAudioVisualItems({ type: 'teaching', ordering: 'latest' }, controller.signal),
      fetchAudioVisualSeries(controller.signal),
      fetchAudioVisualItems({ type: 'short', ordering: 'latest' }, controller.signal),
      fetchAudioVisualItems({ type: 'other', ordering: 'latest' }, controller.signal),
    ])
      .then(([
        homeResult,
        railsResult,
        liveResult,
        latestSermonResult,
        featuredResult,
        livestreamsResult,
        musicResult,
        sermonsResult,
        teachingsResult,
        seriesResult,
        shortsResult,
        exploreResult,
      ]) => {
        const payload = homeResult.status === 'fulfilled' ? homeResult.value : fallbackMediaHome;
        const live = liveResult.status === 'fulfilled' && liveResult.value ? liveResult.value : payload.live;
        const nextPayload = { ...payload, live };
        const hasContent = Boolean(
          payload.hero ||
          payload.live ||
          payload.rails.some((rail) => rail.items.length > 0) ||
          (latestSermonResult.status === 'fulfilled' && latestSermonResult.value) ||
          (featuredResult.status === 'fulfilled' && featuredResult.value.length > 0) ||
          (livestreamsResult.status === 'fulfilled' && livestreamsResult.value.length > 0) ||
          (musicResult.status === 'fulfilled' && musicResult.value.length > 0) ||
          (sermonsResult.status === 'fulfilled' && sermonsResult.value.length > 0) ||
          (teachingsResult.status === 'fulfilled' && teachingsResult.value.length > 0) ||
          (seriesResult.status === 'fulfilled' && seriesResult.value.length > 0) ||
          (shortsResult.status === 'fulfilled' && shortsResult.value.length > 0) ||
          (exploreResult.status === 'fulfilled' && exploreResult.value.length > 0)
        );
        setHomePayload(hasContent ? nextPayload : fallbackMediaHome);
        setEndpointRails(railsResult.status === 'fulfilled' ? railsResult.value : []);
        setLatestSermon(latestSermonResult.status === 'fulfilled' ? latestSermonResult.value : null);
        setFeaturedItems(featuredResult.status === 'fulfilled' ? featuredResult.value : []);
        setLivestreamItems(livestreamsResult.status === 'fulfilled' ? livestreamsResult.value : []);
        setMusicItems(musicResult.status === 'fulfilled' ? musicResult.value : []);
        setSermonItems(sermonsResult.status === 'fulfilled' ? sermonsResult.value : []);
        setTeachingItems(teachingsResult.status === 'fulfilled' ? teachingsResult.value : []);
        setSeriesItems(seriesResult.status === 'fulfilled' ? seriesResult.value : []);
        setShortItems(shortsResult.status === 'fulfilled' ? shortsResult.value : []);
        setExploreItems(exploreResult.status === 'fulfilled' ? exploreResult.value : []);
        setStatus(homeResult.status === 'fulfilled' && hasContent ? 'ready' : 'fallback');
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (seriesItems.length === 0 || seriesItems.every((series) => series.thumbnailUrl || !series.slug)) {
      return;
    }

    const controller = new AbortController();

    hydrateSeriesThumbnails(seriesItems, controller.signal)
      .then((hydratedSeries) => {
        const addedThumbnail = hydratedSeries.some((series, index) => !seriesItems[index]?.thumbnailUrl && Boolean(series.thumbnailUrl));

        if (!controller.signal.aborted && addedThumbnail) {
          setSeriesItems(hydratedSeries);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [seriesItems]);

  useEffect(() => {
    if (!selectedSeries?.slug) {
      setSelectedSeriesDetail(null);
      setSelectedSeriesStatus('idle');
      return;
    }

    const controller = new AbortController();

    setSelectedSeriesStatus('loading');
    setSelectedSeriesDetail(null);

    fetchAudioVisualSeriesDetail(selectedSeries.slug, controller.signal)
      .then((detail) => {
        if (!controller.signal.aborted) {
          setSelectedSeriesDetail(detail);
          setSelectedSeriesStatus('ready');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSelectedSeriesStatus('error');
        }
      });

    return () => controller.abort();
  }, [selectedSeries]);

  useEffect(() => {
    if (!isPagedMediaTab(activeTab) || pagedMedia[activeTab].status !== 'idle') {
      return;
    }

    const controller = new AbortController();
    const query = pagedQueryForTab(activeTab);

    setPagedMedia((current) => ({
      ...current,
      [activeTab]: { ...current[activeTab], status: 'loading' },
    }));

    fetchAudioVisualItemPage({ ...query, page: 1, pageSize: PAGE_SIZE }, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;

        setPagedMedia((current) => ({
          ...current,
          [activeTab]: {
            count: page.count,
            items: page.items,
            page: 1,
            status: 'ready',
          },
        }));
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setPagedMedia((current) => ({
          ...current,
          [activeTab]: { ...current[activeTab], status: 'error' },
        }));
      });

    return () => controller.abort();
  }, [activeTab]);

  useEffect(() => {
    const currentState = musicPagedMedia[activeMusicSubcategory];

    if (activeTab !== 'music' || currentState.status !== 'idle' || musicRequestsInFlight.current.has(activeMusicSubcategory)) {
      return;
    }

    const controller = new AbortController();
    const query = musicSubcategoryQuery(activeMusicSubcategory);
    musicRequestsInFlight.current.add(activeMusicSubcategory);

    setMusicPagedMedia((current) => ({
      ...current,
      [activeMusicSubcategory]: { ...current[activeMusicSubcategory], status: 'loading' },
    }));

    fetchAudioVisualItemPage({ ...query, page: 1, pageSize: PAGE_SIZE }, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;

        setMusicPagedMedia((current) => ({
          ...current,
          [activeMusicSubcategory]: {
            count: page.count,
            items: page.items,
            page: 1,
            status: 'ready',
          },
        }));
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setMusicPagedMedia((current) => ({
          ...current,
          [activeMusicSubcategory]: { ...current[activeMusicSubcategory], status: 'error' },
        }));
      })
      .finally(() => {
        musicRequestsInFlight.current.delete(activeMusicSubcategory);
      });

    return () => controller.abort();
  }, [activeMusicSubcategory, activeTab]);

  const rails = useMemo(() => {
    const railMap = new Map([...endpointRails, ...homePayload.rails].map((rail) => [rail.key, rail]));
    const useFallback = status === 'fallback';

    return {
      featured: mergeRail(railMap.get('featured'), fallbackMediaHome.rails[0], featuredItems, useFallback),
      explore: mergeRail(undefined, fallbackMediaHome.rails[2], exploreItems, useFallback),
      livestreams: mergeRail(undefined, fallbackMediaHome.rails[2], livestreamItems, useFallback),
      music: mergeRail(undefined, fallbackMediaHome.rails[2], musicItems, useFallback),
      latestSermons: mergeRail(undefined, fallbackMediaHome.rails[2], sermonItems, useFallback),
      shorts: mergeRail(railMap.get('shorts') || railMap.get('highlights'), fallbackMediaHome.rails[3], shortItems, useFallback),
      teachings: mergeRail(undefined, fallbackMediaHome.rails[2], teachingItems, useFallback),
    };
  }, [endpointRails, exploreItems, featuredItems, homePayload.rails, livestreamItems, musicItems, sermonItems, shortItems, status, teachingItems]);
  const heroSermon = useMemo(
    () => selectMediaHeroItem({ home: homePayload, latestSermon, useFallback: status === 'fallback' }),
    [homePayload, latestSermon, status]
  );
  const sermonSeries = useMemo(() => (seriesItems.length > 0 ? seriesItems : status === 'fallback' ? fallbackSeries() : []), [seriesItems, status]);
  const handleSeriesSelect = (series: AudioVisualLookup) => {
    if (!series.slug) {
      return;
    }

    setSelectedSeries(series);
    setActiveTab('series');
  };
  const handleLoadMore = async (tab: PagedMediaKey) => {
    const currentPage = pagedMedia[tab];

    if (currentPage.status === 'loading' || currentPage.items.length >= currentPage.count) {
      return;
    }

    const nextPage = currentPage.page + 1;
    const query = pagedQueryForTab(tab);

    setPagedMedia((current) => ({
      ...current,
      [tab]: { ...current[tab], status: 'loading' },
    }));

    try {
      const page = await fetchAudioVisualItemPage({ ...query, page: nextPage, pageSize: PAGE_SIZE });

      setPagedMedia((current) => ({
        ...current,
        [tab]: {
          count: page.count,
          items: mergeMediaItems(current[tab].items, page.items),
          page: nextPage,
          status: 'ready',
        },
      }));
    } catch {
      setPagedMedia((current) => ({
        ...current,
        [tab]: { ...current[tab], status: 'error' },
      }));
    }
  };

  const handleMusicLoadMore = async () => {
    const currentPage = musicPagedMedia[activeMusicSubcategory];

    if (currentPage.status === 'loading' || currentPage.items.length >= currentPage.count) {
      return;
    }

    const nextPage = currentPage.page + 1;
    const query = musicSubcategoryQuery(activeMusicSubcategory);

    setMusicPagedMedia((current) => ({
      ...current,
      [activeMusicSubcategory]: { ...current[activeMusicSubcategory], status: 'loading' },
    }));

    try {
      const page = await fetchAudioVisualItemPage({ ...query, page: nextPage, pageSize: PAGE_SIZE });

      setMusicPagedMedia((current) => ({
        ...current,
        [activeMusicSubcategory]: {
          count: page.count,
          items: mergeMediaItems(current[activeMusicSubcategory].items, page.items),
          page: nextPage,
          status: 'ready',
        },
      }));
    } catch {
      setMusicPagedMedia((current) => ({
        ...current,
        [activeMusicSubcategory]: { ...current[activeMusicSubcategory], status: 'error' },
      }));
    }
  };

  const tabItems = (tab: PagedMediaKey, fallbackItems: AudioVisualItem[]) =>
    pagedMedia[tab].items.length > 0 ? pagedMedia[tab].items : fallbackItems;

  const canLoadMore = (tab: PagedMediaKey) =>
    pagedMedia[tab].count > 0 && pagedMedia[tab].items.length < pagedMedia[tab].count;
  const activeMusicState = musicPagedMedia[activeMusicSubcategory];
  const musicTabItems = activeMusicState.items.length > 0 ? activeMusicState.items : activeMusicSubcategory === 'all' ? rails.music.items : [];
  const canLoadMoreMusic = activeMusicState.count > 0 && activeMusicState.items.length < activeMusicState.count;
  const activeMusicTitle = musicSubcategoryTitle(activeMusicSubcategory);
  const resolvedPreviewCounts = {
    ...getPreviewCounts(),
    ...previewCounts,
  };

  return (
    <div className={`flex min-h-screen flex-col overflow-x-clip transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <SiteHeader activePath="/media" darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main className={`flex-1 pb-24 transition-colors duration-500 lg:pb-0 ${darkMode ? 'bg-[#050505] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
        <MediaHero darkMode={darkMode} heroItem={heroSermon} home={homePayload} />
        <MediaCategoryTabs
          activeMusicSubcategory={activeMusicSubcategory}
          activeTab={activeTab}
          darkMode={darkMode}
          onMusicSubcategoryChange={setActiveMusicSubcategory}
          onTabChange={setActiveTab}
        />

        <section className="px-4 py-8 sm:px-6 lg:py-10 xl:px-8">
          <div className="grid gap-8">
            {status === 'fallback' && (
              <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                darkMode ? 'border-white/10 bg-white/[0.04] text-stone-300' : 'border-black/10 bg-white text-zinc-700 shadow-sm shadow-zinc-900/5'
              }`}>
                Media API content is loading from curated placeholders until the backend response is available.
              </div>
            )}
            {status === 'loading' && (
              <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                darkMode ? 'border-white/10 bg-white/[0.04] text-stone-300' : 'border-black/10 bg-white text-zinc-700 shadow-sm shadow-zinc-900/5'
              }`}>
                Loading media library...
              </div>
            )}
            {activeTab === 'all' && (
              <>
                <MediaFeatured darkMode={darkMode} items={rails.featured.items} onViewMore={() => setActiveTab('featured')} />
                <MediaSeriesRail
                  darkMode={darkMode}
                  items={sermonSeries}
                  onViewMore={() => setActiveTab('series')}
                  selectedSlug={selectedSeries?.slug}
                  onSeriesSelect={handleSeriesSelect}
                />
                <MediaRail
                  darkMode={darkMode}
                  initialVisibleItems={resolvedPreviewCounts.sermons}
                  title="Latest Sermons"
                  items={rails.latestSermons.items}
                  relatedContext={{ type: 'sermon' }}
                  onViewMore={() => setActiveTab('sermons')}
                />
                <MediaRail
                  darkMode={darkMode}
                  initialVisibleItems={resolvedPreviewCounts.music}
                  title="Music"
                  items={rails.music.items}
                  relatedContext={{ label: 'Music', type: 'music' }}
                  onViewMore={() => setActiveTab('music')}
                />
                {rails.teachings.items.length > 0 && (
                  <MediaRail
                    darkMode={darkMode}
                    initialVisibleItems={resolvedPreviewCounts.sermons}
                    title="Teachings"
                    items={rails.teachings.items}
                    relatedContext={{ type: 'teaching' }}
                    onViewMore={() => setActiveTab('teachings')}
                  />
                )}
                <MediaRail
                  darkMode={darkMode}
                  initialVisibleItems={resolvedPreviewCounts.livestreams}
                  title="Livestreams"
                  items={rails.livestreams.items.slice(0, resolvedPreviewCounts.livestreams)}
                  relatedContext={{ type: 'livestream' }}
                  onViewMore={() => setActiveTab('livestreams')}
                />
                <MediaRail
                  darkMode={darkMode}
                  initialVisibleItems={resolvedPreviewCounts.shorts}
                  title="Shorts & Highlights"
                  items={rails.shorts.items}
                  relatedContext={{ type: 'short' }}
                  variant="portrait"
                  onViewMore={() => setActiveTab('shorts')}
                />
              </>
            )}
            {activeTab === 'shorts' && (
              <MediaRail
                canLoadMore={canLoadMore('shorts')}
                darkMode={darkMode}
                items={tabItems('shorts', rails.shorts.items)}
                loadingMore={pagedMedia.shorts.status === 'loading'}
                relatedContext={{ type: 'short' }}
                title="Shorts & Highlights"
                variant="portrait"
                onLoadMore={() => handleLoadMore('shorts')}
              />
            )}
            {activeTab === 'sermons' && (
              <MediaRail
                canLoadMore={canLoadMore('sermons')}
                darkMode={darkMode}
                items={tabItems('sermons', rails.latestSermons.items)}
                loadingMore={pagedMedia.sermons.status === 'loading'}
                relatedContext={{ type: 'sermon' }}
                title="Sermons"
                onLoadMore={() => handleLoadMore('sermons')}
              />
            )}
            {activeTab === 'featured' && (
              <MediaRail
                canLoadMore={canLoadMore('featured')}
                darkMode={darkMode}
                items={tabItems('featured', rails.featured.items)}
                loadingMore={pagedMedia.featured.status === 'loading'}
                relatedContext={{ type: 'sermon' }}
                title="Featured"
                onLoadMore={() => handleLoadMore('featured')}
              />
            )}
            {activeTab === 'teachings' && (
              <MediaRail
                canLoadMore={canLoadMore('teachings')}
                darkMode={darkMode}
                items={tabItems('teachings', rails.teachings.items)}
                loadingMore={pagedMedia.teachings.status === 'loading'}
                relatedContext={{ type: 'teaching' }}
                title="Teachings"
                onLoadMore={() => handleLoadMore('teachings')}
              />
            )}
            {activeTab === 'series' && (
              <>
                <MediaSeriesRail
                  darkMode={darkMode}
                  items={sermonSeries}
                  selectedSlug={selectedSeries?.slug}
                  onSeriesSelect={handleSeriesSelect}
                />
                <MediaSeriesDetail darkMode={darkMode} series={selectedSeriesDetail} status={selectedSeriesStatus} />
              </>
            )}
            {activeTab === 'livestreams' && (
              <MediaRail
                canLoadMore={canLoadMore('livestreams')}
                darkMode={darkMode}
                items={tabItems('livestreams', rails.livestreams.items)}
                loadingMore={pagedMedia.livestreams.status === 'loading'}
                relatedContext={{ type: 'livestream' }}
                title="Livestreams"
                onLoadMore={() => handleLoadMore('livestreams')}
              />
            )}
            {activeTab === 'music' && (
              <section className="grid gap-8">
                <MusicSubcategoryTabs
                  activeTab={activeMusicSubcategory}
                  darkMode={darkMode}
                  onTabChange={setActiveMusicSubcategory}
                />
                <div className="flex items-center gap-4">
                  <div className={`h-px flex-1 ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                  <h2 className={`shrink-0 text-center text-sm font-black uppercase tracking-[0.16em] ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{activeMusicTitle}</h2>
                  <div className={`h-px flex-1 ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                </div>
                <MediaRail
                  canLoadMore={canLoadMoreMusic}
                  darkMode={darkMode}
                  items={musicTabItems}
                  loadingMore={activeMusicState.status === 'loading'}
                  relatedContext={{
                    label: activeMusicTitle,
                    type: 'music',
                    ...(activeMusicSubcategory === 'all' ? {} : { musicSubcategory: activeMusicSubcategory }),
                  }}
                  showHeader={false}
                  title={activeMusicTitle}
                  onLoadMore={handleMusicLoadMore}
                />
                {activeMusicState.status === 'ready' && musicTabItems.length === 0 && (
                  <div className={`rounded-3xl border px-5 py-8 text-center text-sm font-bold ${
                    darkMode ? 'border-white/10 bg-white/[0.04] text-stone-300' : 'border-black/10 bg-white text-zinc-700 shadow-sm shadow-zinc-900/5'
                  }`}>
                    No music has been published in this collection yet.
                  </div>
                )}
              </section>
            )}
            {activeTab === 'explore' && (
              <MediaRail
                canLoadMore={canLoadMore('explore')}
                darkMode={darkMode}
                items={tabItems('explore', rails.explore.items)}
                loadingMore={pagedMedia.explore.status === 'loading'}
                relatedContext={{ type: 'other' }}
                title="Explore Media"
                onLoadMore={() => handleLoadMore('explore')}
              />
            )}
          </div>
        </section>

        <MediaCallout darkMode={darkMode} />
      </main>

      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default MediaPage;
