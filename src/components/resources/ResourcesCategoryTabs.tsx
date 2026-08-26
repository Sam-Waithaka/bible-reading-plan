import { Check, ChevronDown, FileText, Grid2X2, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PublicResourceType } from '../../types/writing';
import { ResourcesIcon } from '../../constants/siteIcons';
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

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ResourcesCategoryTabs = ({ darkMode, resourceTypes = [] }: ResourcesCategoryTabsProps) => {
  const [open, setOpen] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);
  const [concealedWhileScrolling, setConcealedWhileScrolling] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetId = useId();
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

  const closeSheet = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setNearFooter(entry.isIntersecting), {
      rootMargin: '0px 0px 88px 0px',
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let previousScrollY = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - previousScrollY;

        if (currentScrollY < 160 || delta < -8) setConcealedWhileScrolling(false);
        else if (delta > 12 && !open) setConcealedWhileScrolling(true);

        previousScrollY = currentScrollY;
        frame = 0;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const activeLink = sheetRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    window.requestAnimationFrame(() => (activeLink ?? sheetRef.current?.querySelector<HTMLElement>(focusableSelector))?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSheet();
        return;
      }
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <nav className="relative z-10 -mt-7 hidden xl:block" aria-label="Resource library categories">
        <ResourcesContainer>
          <div
            className={`flex flex-wrap justify-center gap-2 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl ${
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

      <div
        className={`fixed inset-x-0 z-40 flex justify-center px-4 transition duration-200 xl:hidden ${
          (nearFooter || concealedWhileScrolling) && !open ? 'pointer-events-none translate-y-6 opacity-0' : 'translate-y-0 opacity-100'
        }`}
        style={{ bottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-controls={sheetId}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className={`flex min-h-12 max-w-[min(76vw,19rem)] items-center gap-2.5 rounded-full border px-4 text-left shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 motion-reduce:transform-none ${
            darkMode
              ? 'border-white/15 bg-zinc-950 text-stone-100 shadow-black/40 ring-1 ring-white/5 focus:ring-offset-[#080808]'
              : 'border-black/10 bg-[#fffaf0] text-zinc-950 shadow-zinc-900/10 ring-1 ring-white/80 hover:bg-white focus:ring-offset-[#f8f5ef]'
          }`}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-red-800">
            <ResourcesIcon size={15} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-black">{activeCategory.label}</span>
          <ChevronDown size={17} className="shrink-0 text-zinc-500 dark:text-stone-400" aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 size-full cursor-default bg-black/70 backdrop-blur-sm"
            aria-label="Close resource browser"
            onClick={closeSheet}
          />
          <div
            ref={sheetRef}
            id={sheetId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${sheetId}-title`}
            className={`absolute inset-x-0 bottom-0 max-h-[min(78dvh,42rem)] overflow-hidden rounded-t-[2rem] border-t shadow-2xl ${
              darkMode ? 'border-white/10 bg-[#0b0b0b] text-stone-100' : 'border-black/10 bg-[#fffaf0] text-zinc-950'
            }`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">The Library</p>
                <h2 id={`${sheetId}-title`} className="mt-1 font-serif text-2xl font-bold">Browse Resources</h2>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                aria-label="Close resource browser"
                className="grid size-11 place-items-center rounded-full border border-black/10 transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:hover:bg-white/10"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <nav className="max-h-[calc(min(78dvh,42rem)-5.5rem)] overflow-y-auto overscroll-contain px-4 py-3" aria-label="Browse resource categories">
              {categories.map((category, index) => {
                const Icon = index === 0 ? Grid2X2 : FileText;
                const isActive = category.key === activeCategory.key;
                return (
                  <a
                    key={category.key}
                    href={category.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-14 items-center gap-3 rounded-xl px-3 text-base font-bold transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-700 ${
                      isActive
                        ? 'bg-red-800 text-white'
                        : darkMode
                          ? 'text-stone-200 hover:bg-white/10'
                          : 'text-zinc-800 hover:bg-white'
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="min-w-0 flex-1">{category.label}</span>
                    {isActive ? <Check size={18} aria-label="Selected" /> : null}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ResourcesCategoryTabs;