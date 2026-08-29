import { BookOpenCheck, Check, ChevronDown, Compass, Grid2X2, ListVideo, Music2, PlayCircle, Radio, Star, Tv } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MediaIcon } from '../../constants/siteIcons';
import FloatingBrowseControl from '../navigation/FloatingBrowseControl';
import { musicSubcategoryTabs } from './MusicSubcategoryTabs';
import type { MusicSubcategoryKey } from './MusicSubcategoryTabs';

export type MediaTabKey = 'all' | 'sermons' | 'featured' | 'teachings' | 'series' | 'livestreams' | 'music' | 'shorts' | 'explore';

const tabs: Array<{ icon: LucideIcon; key: MediaTabKey; label: string }> = [
  { label: 'All', icon: Grid2X2, key: 'all' },
  { label: 'Sermons', icon: PlayCircle, key: 'sermons' },
  { label: 'Featured', icon: Star, key: 'featured' },
  { label: 'Teachings', icon: BookOpenCheck, key: 'teachings' },
  { label: 'Series', icon: ListVideo, key: 'series' },
  { label: 'Livestreams', icon: Tv, key: 'livestreams' },
  { label: 'Music', icon: Music2, key: 'music' },
  { label: 'Shorts', icon: Radio, key: 'shorts' },
  { label: 'Explore', icon: Compass, key: 'explore' },
];

type MediaCategoryTabsProps = {
  activeTab: MediaTabKey;
  darkMode: boolean;
  activeMusicSubcategory?: MusicSubcategoryKey;
  onMusicSubcategoryChange?: (tab: MusicSubcategoryKey) => void;
  onTabChange: (tab: MediaTabKey) => void;
};

const MediaCategoryTabs = ({ activeMusicSubcategory = 'all', activeTab, darkMode, onMusicSubcategoryChange, onTabChange }: MediaCategoryTabsProps) => (
  <>
    <nav className="-mt-7 hidden px-4 sm:px-6 xl:block xl:px-8" aria-label="Media categories">
      <div className={`relative z-10 grid gap-2 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl md:grid-cols-5 xl:grid-cols-9 ${
        darkMode ? 'border-white/10 bg-black/55 shadow-black/30' : 'border-black/10 bg-white/90 shadow-zinc-900/10'
      }`}>
        {tabs.map(({ icon: Icon, key, label }) => {
          const isActive = activeTab === key;

          return (
          <button
            key={key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onTabChange(key)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
              isActive
                ? 'bg-red-800 text-white shadow-md shadow-red-950/30'
                : darkMode
                  ? 'text-stone-300 hover:bg-white/10 hover:text-white'
                  : 'text-zinc-700 hover:bg-[#fffaf0] hover:text-zinc-950'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
          );
        })}
      </div>
    </nav>
    <MediaMobileCollections
      activeMusicSubcategory={activeMusicSubcategory}
      activeTab={activeTab}
      darkMode={darkMode}
      onMusicSubcategoryChange={onMusicSubcategoryChange}
      onTabChange={onTabChange}
    />
  </>
);

const MediaMobileCollections = ({
  activeMusicSubcategory = 'all',
  activeTab,
  darkMode,
  onMusicSubcategoryChange,
  onTabChange,
}: MediaCategoryTabsProps) => {
  const activeLabel = tabs.find((tab) => tab.key === activeTab)?.label || 'All';
  const activeMusicLabel = musicSubcategoryTabs.find((tab) => tab.key === activeMusicSubcategory)?.label || 'All';
  const triggerLabel = activeTab === 'all' ? 'All Media' : activeTab === 'music' ? activeMusicLabel : activeLabel;

  return (
    <FloatingBrowseControl darkMode={darkMode} dialogLabel="media collections" eyebrow="Media" icon={MediaIcon} title="Browse Collections" triggerAriaLabel={`Media Collections: ${triggerLabel}`} triggerLabel={triggerLabel}>
      {(close) => (
        <div className="grid gap-1" role="navigation" aria-label="Browse media collections">
          {tabs.map(({ icon: Icon, key, label }) => {
            const isActive = activeTab === key;
            return (
              <div key={key} className="grid gap-2">
                <button type="button" aria-pressed={isActive} onClick={() => { onTabChange(key); if (key !== 'music') close(); }} className={`flex min-h-14 box-border w-full max-w-full min-w-0 items-center gap-3 rounded-xl px-3 text-left text-base font-bold transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-700 ${isActive ? 'bg-red-800 text-white' : darkMode ? 'text-stone-200 hover:bg-white/10' : 'text-zinc-800 hover:bg-white'}`}>
                  <Icon size={18} aria-hidden="true" />
                  <span className="min-w-0 flex-1">{key === 'all' ? 'All Media' : label}</span>
                  {key === 'music' ? <ChevronDown size={16} className={`shrink-0 transition ${isActive ? 'rotate-180' : ''}`} aria-hidden="true" /> : isActive ? <Check size={18} aria-label="Selected" /> : null}
                </button>
                {key === 'music' && isActive ? (
                  <div className="ml-6 grid gap-2 border-l border-black/10 pl-3 dark:border-white/10">
                    {musicSubcategoryTabs.map(({ icon: MusicIcon, key: musicKey, label: musicLabel }) => {
                      const isMusicActive = activeMusicSubcategory === musicKey;
                      return (
                        <button key={musicKey} type="button" aria-label={`Music ${musicLabel}`} aria-pressed={isMusicActive} onClick={() => { onTabChange('music'); onMusicSubcategoryChange?.(musicKey); close(); }} className={`flex min-h-11 items-center gap-3 rounded-full border px-4 text-left text-sm font-bold transition ${isMusicActive ? darkMode ? 'border-red-200/25 bg-white/15 text-white' : 'border-red-900/15 bg-white/80 text-red-900 shadow-sm' : darkMode ? 'border-white/10 bg-white/5 text-stone-200 hover:bg-white/10' : 'border-black/10 bg-white/50 text-zinc-800 hover:bg-white'}`}>
                          <MusicIcon size={16} aria-hidden="true" />
                          <span className="min-w-0 flex-1">{musicLabel}</span>
                          {isMusicActive ? <Check size={16} aria-label="Selected" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </FloatingBrowseControl>
  );
};

export default MediaCategoryTabs;
