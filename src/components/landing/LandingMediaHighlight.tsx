import { ScriptureIcon } from '../../constants/siteIcons';
import { ArrowRight, Clock, Play } from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AudioVisualHomePayload, AudioVisualItem, AudioVisualLiveCta } from '../../types/audioVisual';
import {
  fetchAudioVisualHome,
  fetchAudioVisualItemPage,
  fetchFeaturedAudioVisualItems,
  fetchLatestSermon,
  fetchLiveAudioVisualCta,
} from '../../services/audioVisualApi';
import { formatDuration, formatMediaDate } from '../media/mediaFormat';
import { selectMediaHeroItem } from '../media/mediaHeroSelection';
import { getMediaWatchPath } from '../media/mediaLinks';
import SiteButton from '../ui/SiteButton';

type LandingMediaHighlightProps = {
  darkMode: boolean;
};

type MediaHighlightState = {
  featured: AudioVisualItem[];
  home: AudioVisualHomePayload | null;
  latestFeaturedSermon: AudioVisualItem | null;
  latestLiveService: AudioVisualItem | null;
  latestSermon: AudioVisualItem | null;
  latestWorship: AudioVisualItem | null;
  live: AudioVisualLiveCta | null;
  status: 'loading' | 'ready' | 'empty';
};

const initialState: MediaHighlightState = {
  featured: [],
  home: null,
  latestFeaturedSermon: null,
  latestLiveService: null,
  latestSermon: null,
  latestWorship: null,
  live: null,
  status: 'loading',
};

const itemKey = (item: AudioVisualItem) => item.slug || String(item.id || item.title);

const uniqueItems = (items: Array<AudioVisualItem | null | undefined>) => {
  const seen = new Set<string>();

  return items.filter((item): item is AudioVisualItem => {
    if (!item) return false;
    const key = itemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const describeMedia = (item: AudioVisualItem) =>
  item.descriptionExcerpt || item.description || 'A message to strengthen faith beyond Sunday.';

const buildMetaLine = (item: AudioVisualItem) =>
  [item.speaker, formatMediaDate(item.publishedAt)].filter(Boolean).join(' / ');

const getMediaLabel = (item: AudioVisualItem) => {
  if (item.liveStatus === 'live') return 'Live';
  if (item.liveStatus === 'upcoming') return 'Upcoming';
  return item.series?.name || item.mediaTypeLabel || item.mediaType;
};

const PrimaryMediaCard = ({ darkMode, item }: { darkMode: boolean; item: AudioVisualItem }) => {
  const duration = formatDuration(item.durationSeconds);

  return (
    <Link to={getMediaWatchPath(item)} className="group block">
      <article
        className={`relative min-h-[30rem] overflow-hidden rounded-[1.75rem] border shadow-2xl transition duration-300 hover:-translate-y-1 sm:min-h-[28rem] ${
          darkMode
            ? 'border-red-100/15 bg-black shadow-red-950/35 hover:border-red-200/30'
            : 'border-black/10 bg-zinc-950 shadow-zinc-900/20 hover:border-red-800/25'
        }`}
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-red-950 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />

        <div className="relative flex min-h-[30rem] flex-col justify-between p-6 text-white sm:min-h-[28rem] sm:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/35 px-4 py-2 text-[0.65rem] font-black uppercase tracking-[0.18em] backdrop-blur">
              <span className="size-2 rounded-full bg-red-500" aria-hidden="true" />
              {item.liveStatus === 'live' || item.liveStatus === 'upcoming' ? 'Live service' : 'Latest message'}
            </span>
          </div>

          <div className="grid gap-5 lg:max-w-[34rem]">
            <div className="grid gap-3">
              <h3 className="max-w-xl font-serif text-4xl leading-none sm:text-5xl lg:text-6xl">{item.title}</h3>
              {item.speaker && <p className="text-sm font-bold text-stone-100 sm:text-base">{item.speaker}</p>}
              {duration && (
                <p className="inline-flex items-center gap-2 text-sm text-stone-200">
                  <Clock size={16} aria-hidden="true" />
                  {duration}
                </p>
              )}
              <p className="line-clamp-3 max-w-md text-sm leading-6 text-stone-200">{describeMedia(item)}</p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-black/30 px-6 py-3 text-sm font-bold text-white backdrop-blur transition group-hover:border-red-400/50">
                Watch Now
                <ArrowRight size={18} aria-hidden="true" />
              </span>

              {item.scriptureReference && (
                <span className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-left text-xs text-stone-200 shadow-xl backdrop-blur">
                  <ScriptureIcon size={24} aria-hidden="true" />
                  <span>
                    <span className="block text-[0.65rem] text-stone-300">Referenced Scripture</span>
                    <span className="block font-black text-white">{item.scriptureReference}</span>
                  </span>
                </span>
              )}
            </div>
          </div>

          <span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-red-800 text-white shadow-[0_0_0_12px_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.35)] transition duration-300 group-hover:scale-105 sm:size-24">
            <Play size={34} fill="currentColor" aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  );
};

const ContinueCard = ({ darkMode, item }: { darkMode: boolean; item: AudioVisualItem }) => {
  const duration = formatDuration(item.durationSeconds);

  return (
    <Link to={getMediaWatchPath(item)} className="group block">
      <article
        className={`relative min-h-44 overflow-hidden rounded-2xl border bg-black text-white shadow-xl transition duration-300 hover:-translate-y-1 ${
          darkMode ? 'border-white/[0.12] shadow-black/35 hover:border-red-200/25' : 'border-black/10 shadow-black/10'
        }`}
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
        <div className="relative flex min-h-44 flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] backdrop-blur">
              {getMediaLabel(item)}
            </span>
            <span className="grid size-10 place-items-center rounded-full border border-white/45 bg-black/20 backdrop-blur">
              <Play size={16} fill="currentColor" aria-hidden="true" />
            </span>
          </div>

          <div>
            <h3 className="line-clamp-2 text-lg font-black leading-tight">{item.title}</h3>
            <p className="mt-1 truncate text-xs text-stone-200">{buildMetaLine(item)}</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                <span className="block h-full w-2/5 rounded-full bg-red-700" />
              </span>
              {duration && <span className="text-xs font-bold">{duration}</span>}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

const LandingMediaHighlight = ({ darkMode }: LandingMediaHighlightProps) => {
  const [state, setState] = useState<MediaHighlightState>(initialState);

  useEffect(() => {
    const controller = new AbortController();

    const loadMedia = async () => {
      const [
        homeResult,
        liveResult,
        sermonResult,
        featuredResult,
        liveServiceResult,
        featuredSermonResult,
        worshipResult,
      ] = await Promise.allSettled([
        fetchAudioVisualHome(controller.signal),
        fetchLiveAudioVisualCta(controller.signal),
        fetchLatestSermon(controller.signal),
        fetchFeaturedAudioVisualItems(controller.signal),
        fetchAudioVisualItemPage({ type: 'livestream', ordering: 'latest', pageSize: 1 }, controller.signal),
        fetchAudioVisualItemPage({ type: 'sermon', featured: true, ordering: 'latest', pageSize: 3 }, controller.signal),
        fetchAudioVisualItemPage({ type: 'music', musicSubcategory: 'pnw', ordering: 'latest', pageSize: 1 }, controller.signal),
      ]);

      if (controller.signal.aborted) return;

      const home = homeResult.status === 'fulfilled' ? homeResult.value : null;
      const live = liveResult.status === 'fulfilled' ? liveResult.value : null;
      const resolvedHome = home ? { ...home, live: live || home.live } : null;
      const latestSermon = sermonResult.status === 'fulfilled' ? sermonResult.value : null;
      const featured = featuredResult.status === 'fulfilled' ? featuredResult.value : [];
      const latestLiveService = liveServiceResult.status === 'fulfilled' ? liveServiceResult.value.items[0] || null : null;
      const latestWorship = worshipResult.status === 'fulfilled' ? worshipResult.value.items[0] || null : null;
      const latestFeaturedSermon =
        featuredSermonResult.status === 'fulfilled'
          ? featuredSermonResult.value.items.find((item) => item.slug !== latestSermon?.slug) || featuredSermonResult.value.items[0] || null
          : null;

      setState({
        featured,
        home: resolvedHome,
        latestFeaturedSermon,
        latestLiveService,
        latestSermon,
        latestWorship,
        live,
        status: resolvedHome?.hero || resolvedHome?.live?.item || live?.item || latestSermon || featured.length > 0 ? 'ready' : 'empty',
      });
    };

    void loadMedia();

    return () => controller.abort();
  }, []);

  const { primary, supporting } = useMemo(() => {
    const primaryItem = state.home
      ? selectMediaHeroItem({ home: state.home, latestSermon: state.latestSermon, useFallback: false })
      : state.latestSermon || state.featured[0] || state.live?.item || null;

    return {
      primary: primaryItem,
      supporting: uniqueItems([
        state.latestLiveService,
        state.latestFeaturedSermon,
        state.latestWorship,
      ]).filter((item) => !primaryItem || itemKey(item) !== itemKey(primaryItem)).slice(0, 3),
    };
  }, [state.featured, state.home, state.latestFeaturedSermon, state.latestLiveService, state.latestSermon, state.latestWorship, state.live]);

  if (state.status === 'empty') {
    return null;
  }

  return (
    <section
      id="latest-media"
      className={`px-3 py-16 sm:px-4 sm:py-20 lg:px-5 lg:py-24 ${darkMode ? 'bg-[#080808]' : 'bg-[#f8f5ef]'}`}
    >
      <div
        className={`mx-auto w-full max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[2rem] border shadow-2xl sm:max-w-[calc(100vw-2rem)] lg:max-w-[calc(100vw-2.5rem)] ${
          darkMode
            ? 'border-red-200/15 bg-[radial-gradient(circle_at_78%_8%,rgba(185,28,28,0.20),transparent_30%),linear-gradient(135deg,#17100f_0%,#1a0508_42%,#070707_100%)] shadow-black/45'
            : 'border-red-950/10 bg-gradient-to-br from-white via-[#fbf7f0] to-[#eee8df] shadow-zinc-900/10'
        }`}
      >
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.38fr_0.62fr] lg:p-12 xl:grid-cols-[0.36fr_0.64fr]">
          <div className="flex flex-col justify-center gap-7">
            <p className={`text-xs font-black uppercase tracking-[0.24em] ${darkMode ? 'text-red-100' : 'text-red-800'}`}>
              Latest From Media
            </p>
            <div className="hidden sm:block">
              <h2 className={`max-w-lg text-5xl font-extrabold leading-tight lg:text-6xl ${darkMode ? 'text-white' : 'text-zinc-950'}`}>
                Stay nourished beyond Sunday.
              </h2>
              <p className={`mt-6 max-w-md text-base leading-7 ${darkMode ? 'text-stone-200' : 'text-zinc-700'}`}>
                Watch, listen, and return to messages that keep God&apos;s Word close through the week.
              </p>
            </div>

            <div className="hidden flex-wrap gap-4 sm:flex">
              <SiteButton darkMode={darkMode} icon={ArrowRight} iconPosition="after" to={primary ? getMediaWatchPath(primary) : '/media'} variant="primary">
                Watch Latest
              </SiteButton>
              <SiteButton darkMode={darkMode} icon={ArrowRight} iconPosition="after" to="/media" variant="secondary">
                Explore Library
              </SiteButton>
            </div>

          </div>

          <div className="grid gap-7">
            {primary ? (
              <PrimaryMediaCard darkMode={darkMode} item={primary} />
            ) : (
              <div
                className={`min-h-[28rem] animate-pulse rounded-[1.75rem] border ${
                  darkMode ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-white/60'
                }`}
                aria-label="Loading latest media"
              />
            )}

            {supporting.length > 0 && (
              <div className="hidden sm:block">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-red-800 text-white">
                      <Play size={15} fill="currentColor" aria-hidden="true" />
                    </span>
                    <h3 className={`text-xs font-black uppercase tracking-[0.24em] ${darkMode ? 'text-white' : 'text-zinc-950'}`}>
                      Continue Watching
                    </h3>
                  </div>
                  <Link
                    to="/media"
                    className={`inline-flex items-center gap-2 text-sm font-black transition hover:translate-x-1 ${darkMode ? 'text-red-50' : 'text-red-800'}`}
                  >
                    View All
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {supporting.map((item) => (
                    <ContinueCard key={itemKey(item)} darkMode={darkMode} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:hidden">
            <div className="grid grid-cols-2 gap-3">
              <SiteButton darkMode={darkMode} icon={ArrowRight} iconPosition="after" to={primary ? getMediaWatchPath(primary) : '/media'} variant="primary">
                Watch Latest
              </SiteButton>
              <SiteButton darkMode={darkMode} icon={ArrowRight} iconPosition="after" to="/media" variant="secondary">
                Explore Library
              </SiteButton>
            </div>
          </div>
        </div>

        {supporting.length > 0 && (
          <div className={`border-t px-5 py-7 sm:hidden ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-red-800 text-white">
                  <Play size={15} fill="currentColor" aria-hidden="true" />
                </span>
                <h3 className={`text-xs font-black uppercase tracking-[0.24em] ${darkMode ? 'text-white' : 'text-zinc-950'}`}>
                  Continue Watching
                </h3>
              </div>
              <Link
                to="/media"
                className={`inline-flex items-center gap-2 text-sm font-black transition hover:translate-x-1 ${darkMode ? 'text-red-100' : 'text-red-800'}`}
              >
                View All
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {supporting.map((item) => (
                <ContinueCard key={itemKey(item)} darkMode={darkMode} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default LandingMediaHighlight;
