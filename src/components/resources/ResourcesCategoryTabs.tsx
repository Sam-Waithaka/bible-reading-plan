import { Check, FileText, Grid2X2 } from 'lucide-react';
import { useMemo } from 'react';
import type { PublicResourceType } from '../../types/writing';
import { ResourcesIcon } from '../../constants/siteIcons';
import FloatingBrowseControl from '../navigation/FloatingBrowseControl';
import ResourcesContainer from './ResourcesContainer';

type ResourceCategory = {
  key: string;
  label: string;
  href: string;
};

type ResourcesCategoryTabsProps = {
  darkMode: boolean;
  resourceTypes?: PublicResourceType[];
};

const ResourcesCategoryTabs = ({ darkMode, resourceTypes = [] }: ResourcesCategoryTabsProps) => {
  const currentPath = typeof window === 'undefined' ? '/resources' : window.location.pathname;
  const categories = useMemo<ResourceCategory[]>(
    () => [
      { key: 'all', label: 'All Resources', href: '/resources' },
      ...resourceTypes.map((resourceType) => ({
        key: String(resourceType.slug || resourceType.id),
        label: resourceType.name,
        href: `/resources/type/${encodeURIComponent(String(resourceType.slug || resourceType.id))}`,
      })),
    ],
    [resourceTypes],
  );
  const activeCategory =
    categories.find((category) => currentPath === category.href || (category.key === 'all' && currentPath === '/resources/')) ??
    categories[0];

  return (
    <>
      <nav className="relative z-10 -mt-7 hidden box-border w-full max-w-full min-w-0 xl:block" aria-label="Resource library categories">
        <ResourcesContainer>
          <div
            className={`flex box-border w-full max-w-full min-w-0 flex-wrap justify-center gap-2 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl ${
              darkMode ? 'border-white/10 bg-black/70 shadow-black/30' : 'border-black/10 bg-white/95 shadow-zinc-900/10'
            }`}
          >
            {categories.map((category, index) => {
              const Icon = index === 0 ? Grid2X2 : FileText;
              const isActive = category.key === activeCategory.key;
              return (
                <a
                  key={category.key}
                  aria-current={isActive ? 'page' : undefined}
                  href={category.href}
                  className={`inline-flex min-h-11 min-w-32 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 ${
                    isActive
                      ? 'bg-red-800 text-white shadow-md shadow-red-950/30'
                      : darkMode
                        ? 'text-stone-300 hover:bg-white/10 hover:text-white focus:ring-offset-black'
                        : 'text-zinc-700 hover:bg-[#fffaf0] hover:text-zinc-950 focus:ring-offset-white'
                  }`}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{category.label}</span>
                </a>
              );
            })}
          </div>
        </ResourcesContainer>
      </nav>

      <FloatingBrowseControl darkMode={darkMode} dialogLabel="resource browser" eyebrow="The Library" icon={ResourcesIcon} title="Browse Resources" triggerLabel={activeCategory.label}>
        {(close) => (
          <nav aria-label="Browse resource categories">
            {categories.map((category, index) => {
              const Icon = index === 0 ? Grid2X2 : FileText;
              const isActive = category.key === activeCategory.key;
              return (
                <a key={category.key} href={category.href} aria-current={isActive ? 'page' : undefined} onClick={close} className={`flex min-h-14 box-border w-full max-w-full min-w-0 items-center gap-3 rounded-xl px-3 text-base font-bold transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-700 ${isActive ? 'bg-red-800 text-white' : darkMode ? 'text-stone-200 hover:bg-white/10' : 'text-zinc-800 hover:bg-white'}`}>
                  <Icon size={18} aria-hidden="true" />
                  <span className="min-w-0 flex-1">{category.label}</span>
                  {isActive ? <Check size={18} aria-label="Selected" /> : null}
                </a>
              );
            })}
          </nav>
        )}
      </FloatingBrowseControl>
    </>
  );
};

export default ResourcesCategoryTabs;
