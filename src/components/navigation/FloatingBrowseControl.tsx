import { ChevronDown, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useNearSiteFooter } from '../../hooks/useNearSiteFooter';
import {
  useMobileBlockingOverlay,
  usePageBottomAction,
} from './mobileBottomActionContext';
import { getMobilePageActionStyle, isMobileGiveRouteAllowed } from './mobileBottomActionPolicy';

type FloatingBrowseControlProps = {
  children: (close: () => void) => ReactNode;
  darkMode: boolean;
  dialogLabel: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  triggerAriaLabel?: string;
  triggerLabel: string;
};

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const FloatingBrowseControl = ({ children, darkMode, dialogLabel, eyebrow, icon: Icon, title, triggerAriaLabel, triggerLabel }: FloatingBrowseControlProps) => {
  const currentPathname = typeof window === 'undefined' ? '/' : window.location.pathname;
  const [open, setOpen] = useState(false);
  const nearFooter = useNearSiteFooter();
  const [concealedWhileScrolling, setConcealedWhileScrolling] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const hasOpenedRef = useRef(false);
  const sheetId = useId();
  usePageBottomAction();
  useMobileBlockingOverlay(open);

  const closeSheet = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      return;
    }
    if (hasOpenedRef.current) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, [open]);

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
    const activeItem = sheetRef.current?.querySelector<HTMLElement>('[aria-current="page"], [aria-pressed="true"]');
    window.requestAnimationFrame(() => (activeItem ?? sheetRef.current?.querySelector<HTMLElement>(focusableSelector))?.focus());
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
  }, [closeSheet, open]);

  return (
    <>
      <div
        data-mobile-bottom-action="page"
        data-responsive-bottom-action="mobile-paired-tablet-centered"
        className={`fixed z-40 flex box-border min-w-0 justify-start transition duration-200 md:!left-1/2 md:!right-auto md:w-[min(24rem,calc(100%-3rem))] md:!-translate-x-1/2 md:justify-center xl:hidden ${(nearFooter || concealedWhileScrolling) && !open ? 'pointer-events-none translate-y-6 opacity-0' : 'translate-y-0 opacity-100'}`}
        style={getMobilePageActionStyle(isMobileGiveRouteAllowed(currentPathname))}
      >
        <button ref={triggerRef} type="button" aria-label={triggerAriaLabel} aria-controls={sheetId} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(true)} className={`flex min-h-12 w-full max-w-sm min-w-0 items-center gap-2.5 rounded-full border px-4 text-left shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 motion-reduce:transform-none ${darkMode ? 'border-white/15 bg-zinc-950 text-stone-100 shadow-black/40 ring-1 ring-white/5 focus:ring-offset-[#080808]' : 'border-black/10 bg-[#fffaf0] text-zinc-950 shadow-zinc-900/10 ring-1 ring-white/80 hover:bg-white focus:ring-offset-[#f8f5ef]'}`}>
          <span className="grid size-7 shrink-0 place-items-center text-red-800 dark:text-red-100"><Icon size={15} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1 truncate text-sm font-black">{triggerLabel}</span>
          <ChevronDown size={17} className="shrink-0 text-red-800 dark:text-red-100" aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[65] box-border w-full max-w-full min-w-0 xl:hidden">
          <button type="button" className="absolute inset-0 size-full cursor-default bg-black/70 backdrop-blur-sm" aria-label={`Close ${dialogLabel}`} onClick={closeSheet} />
          <div ref={sheetRef} id={sheetId} role="dialog" aria-modal="true" aria-labelledby={`${sheetId}-title`} className={`absolute inset-x-0 bottom-0 box-border w-full max-w-full min-w-0 max-h-[50dvh] overflow-hidden rounded-t-[2rem] border-t shadow-2xl ${darkMode ? 'border-white/10 bg-[#0b0b0b] text-stone-100' : 'border-black/10 bg-[#fffaf0] text-zinc-950'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex box-border w-full max-w-full min-w-0 items-center justify-between gap-4 border-b border-black/10 px-5 py-4 dark:border-white/10">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">{eyebrow}</p>
                <h2 id={`${sheetId}-title`} className="mt-1 min-w-0 break-words font-serif text-2xl font-bold">{title}</h2>
              </div>
              <button type="button" onClick={closeSheet} aria-label={`Close ${dialogLabel}`} className="grid size-11 place-items-center rounded-full border border-black/10 transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:hover:bg-white/10"><X size={20} aria-hidden="true" /></button>
            </div>
            <div className="box-border w-full max-w-full min-w-0 max-h-[calc(50dvh-5.5rem)] overflow-y-auto overscroll-contain px-4 py-3">{children(closeSheet)}</div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default FloatingBrowseControl;
