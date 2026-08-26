import { ScriptureIcon } from '../../constants/siteIcons';
import { Play } from 'lucide-react';

import type { AudioVisualHomePayload, AudioVisualItem } from '../../types/audioVisual';
import { formatDuration, formatMediaDate } from './mediaFormat';
import { getMediaWatchPath } from './mediaLinks';

type MediaHeroProps = {
  darkMode: boolean;
  heroItem: AudioVisualItem | null;
  home: AudioVisualHomePayload;
};

const MediaHero = ({ darkMode, heroItem, home }: MediaHeroProps) => {
  const sermon = heroItem;
  const background = sermon?.thumbnailUrl || home.hero?.thumbnailUrl || '/images/church-front-left-1920.jpg';
  const meta = sermon ? [sermon.speaker, formatMediaDate(sermon.publishedAt)].filter(Boolean).join(' • ') : '';
  const ctaHref = getMediaWatchPath(sermon);
  const duration = formatDuration(sermon?.durationSeconds);

  return (
    <section className={`relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 lg:pb-20 lg:pt-16 ${darkMode ? 'bg-[#050505]' : 'bg-[#f8f5ef]'}`}>
      <div className="absolute inset-0">
        <img src={background} alt="" className={`size-full object-cover ${darkMode ? 'opacity-28' : 'opacity-12'}`} />
        <div
          className={`absolute inset-0 ${
            darkMode
              ? 'bg-[radial-gradient(circle_at_68%_18%,rgba(153,27,27,0.34),transparent_28%),linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.94)_46%,rgba(5,5,5,0.86)_100%)]'
              : 'bg-[radial-gradient(circle_at_68%_18%,rgba(153,27,27,0.11),transparent_28%),linear-gradient(90deg,#f8f5ef_0%,rgba(248,245,239,0.97)_48%,rgba(236,231,222,0.92)_100%)]'
          }`}
        />
      </div>

      <div className="relative">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(26rem,0.78fr)] lg:items-center">
          <div className="mx-auto max-w-4xl text-left lg:mx-0">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-red-700">A.I.C Njoro Town</p>
            <h1 className={`mt-4 max-w-4xl font-serif text-5xl font-bold leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl ${darkMode ? 'text-white' : 'text-zinc-950'}`}>
              Exalting Christ.
              <span className="block text-red-700">Equipping His People.</span>
              <span className="block">Transforming Lives.</span>
            </h1>
            <div className="mt-6 h-px w-16 bg-red-700" />
            <p className={`mt-5 max-w-2xl text-lg leading-8 ${darkMode ? 'text-stone-300' : 'text-zinc-700'}`}>
              Centered on God&apos;s Word. Led by the Holy Spirit. Watch, listen and be strengthened in faith.
            </p>
          </div>

          <a
            href={ctaHref}
            className={`group overflow-hidden rounded-[2rem] border shadow-2xl backdrop-blur transition duration-300 hover:-translate-y-1 ${
              darkMode ? 'border-white/10 bg-black/55 shadow-black/40 hover:shadow-red-950/30' : 'border-black/10 bg-white/85 shadow-zinc-900/15 hover:shadow-zinc-900/20'
            }`}
          >
            <div className="relative aspect-video">
              <img src={background} alt="" className="size-full object-contain opacity-95 transition duration-300 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid size-20 place-items-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur transition group-hover:scale-105 group-hover:bg-red-800">
                  <Play size={32} fill="currentColor" />
                </span>
              </div>
              {duration && (
                <span className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
                  {duration}
                </span>
              )}
              <span className="absolute left-4 top-4 rounded-full bg-red-800 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white">
                Latest sermon
              </span>
            </div>
            <div className="p-6 text-left">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-red-700">
                <ScriptureIcon size={15} />
                From the pulpit
              </div>
              <h2 className={`mt-3 text-2xl font-extrabold leading-tight tracking-normal ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{sermon?.title || 'Latest sermon'}</h2>
              {meta && <p className={`mt-2 text-sm font-bold ${darkMode ? 'text-stone-400' : 'text-zinc-600'}`}>{meta}</p>}
              <p className={`mt-3 line-clamp-2 text-sm leading-6 ${darkMode ? 'text-stone-300' : 'text-zinc-700'}`}>
                {sermon?.descriptionExcerpt || 'The newest message from A.I.C Njoro Town Church will appear here when published.'}
              </p>
              {sermon?.scriptureReference && (
                <p className={`mt-4 text-xs font-black uppercase tracking-[0.14em] ${darkMode ? 'text-red-200' : 'text-red-800'}`}>{sermon.scriptureReference}</p>
              )}
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default MediaHero;
