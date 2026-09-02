import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, FileText, FolderOpen, LayoutDashboard, Menu, PenLine, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import SiteFooter from '../../navigation/SiteFooter';
import SiteHeader from '../../navigation/SiteHeader';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import {
  canAccessWritingStudio,
  canCreateWriting,
  canManageTaxonomy,
  canPublishWriting,
  canReviewWriting,
  canViewAnyDrafts,
} from '../../../utils/permissions';
import { portalSurface } from '../portalSurface';
import WritingAccessDenied from './WritingAccessDenied';

type WritingStudioShellProps = {
  children: ReactNode;
  compact?: boolean;
  hideNavigation?: boolean;
  intro?: ReactNode;
};

const canViewEditorial = (permissions: string[]) =>
  canReviewWriting(permissions) || canViewAnyDrafts(permissions) || canPublishWriting(permissions);

const navItems = [
  { href: '/portal/writing', icon: LayoutDashboard, label: 'Overview', show: () => true },
  { href: '/portal/writing/articles', icon: FileText, label: 'Articles', show: () => true },
  { href: '/portal/writing/new', icon: PenLine, label: 'New Article', show: canCreateWriting },
  { href: '/portal/writing/library', icon: FolderOpen, label: 'Library', show: canManageTaxonomy },
  { href: '/portal/writing/editorial', icon: BookOpen, label: 'Editorial', show: canViewEditorial },
];

const WritingStudioShell = ({ children, compact = false, hideNavigation = false, intro }: WritingStudioShellProps) => {
  const { darkMode, toggleTheme } = useTheme();
  const auth = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  if (!canAccessWritingStudio(auth.permissions)) return <WritingAccessDenied />;

  const visibleNav = navItems.filter((item) => item.show(auth.permissions));
  const navSurfaceClass = darkMode
    ? 'border-white/10 bg-zinc-950/90 shadow-black/25'
    : 'border-[#eaded0] bg-[#fffaf0]/95 shadow-zinc-900/5';
  const mobilePanelClass = darkMode
    ? 'border-white/10 bg-[#111111] text-stone-100 shadow-black/60'
    : 'border-[#eaded0] bg-[#fffaf0] text-zinc-950 shadow-zinc-900/20';

  return (
    <div className={`flex min-h-screen flex-col overflow-x-clip transition-colors duration-500 ${portalSurface.page(darkMode)}`}>
      <SiteHeader darkMode={darkMode} onToggleTheme={toggleTheme} />
      <main className={`flex-1 px-4 sm:px-6 lg:px-8 ${compact ? 'py-6 sm:py-8' : 'py-10'}`}>
        <section className="w-full">
          {!compact && (intro ?? (
            <div className="max-w-4xl">
              <p className={`text-xs font-black uppercase tracking-[0.18em] ${darkMode ? 'text-red-100' : 'text-red-800'}`}>Writing Studio</p>
              <h1 className="mt-5 font-serif text-5xl leading-tight sm:text-6xl">Create. Review. <span className="text-red-800">Publish.</span> Curate.</h1>
              <p className={`mt-5 max-w-2xl text-lg leading-8 ${portalSurface.mutedText(darkMode)}`}>Build resources that strengthen the church, equip believers, and point people to Christ.</p>
            </div>
          ))}

          {!hideNavigation ? (
            <>
              <nav aria-label="Writing Studio sections" className={`${compact ? '' : 'mt-10'} hidden overflow-x-auto md:block`}>
                <div className={`inline-flex min-w-max items-center gap-1 rounded-2xl border p-1.5 shadow-lg ${navSurfaceClass}`}>
                  {visibleNav.map(({ href, icon: Icon, label }) => (
                    <NavLink
                      key={href}
                      to={href}
                      end={href === '/portal/writing'}
                      className={({ isActive }) => `inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 ${
                        isActive
                          ? 'bg-red-800 text-white shadow-md shadow-red-950/20 focus:ring-offset-[#fffaf0]'
                          : darkMode
                            ? 'text-stone-300 hover:bg-white/10 hover:text-stone-100 focus:ring-offset-[#080808]'
                            : 'text-zinc-700 hover:bg-white hover:text-zinc-950 focus:ring-offset-[#f8f1e7]'
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </nav>

              <button
                type="button"
                aria-controls="writing-studio-mobile-nav"
                aria-expanded={mobileNavOpen}
                aria-label="Open Writing Studio sections"
                onClick={() => setMobileNavOpen(true)}
                className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-red-800 px-4 py-3 text-sm font-black text-white shadow-2xl shadow-red-950/30 transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 focus:ring-offset-[#f8f1e7] md:hidden dark:focus:ring-offset-[#080808]"
              >
                <Menu size={18} />
                Studio
              </button>

              {mobileNavOpen ? (
                <div className="fixed inset-0 z-50 md:hidden" role="presentation">
                  <button
                    type="button"
                    aria-label="Close Writing Studio sections"
                    className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
                    onClick={() => setMobileNavOpen(false)}
                  />
                  <section
                    id="writing-studio-mobile-nav"
                    aria-label="Writing Studio sections"
                    className={`absolute inset-x-0 bottom-0 h-[50svh] rounded-t-[2rem] border p-5 shadow-2xl ${mobilePanelClass}`}
                  >
                    <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-black/15 dark:bg-white/20" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-800">Writing Studio</p>
                        <h2 className="mt-1 font-serif text-2xl leading-tight">Go to section</h2>
                      </div>
                      <button
                        type="button"
                        aria-label="Close Writing Studio sections"
                        onClick={() => setMobileNavOpen(false)}
                        className={`grid size-11 shrink-0 place-items-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-red-700 ${
                          darkMode ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-[#eaded0] bg-white hover:bg-[#fffaf0]'
                        }`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <nav className="mt-5 grid gap-2" aria-label="Writing Studio mobile sections">
                      {visibleNav.map(({ href, icon: Icon, label }) => (
                        <NavLink
                          key={href}
                          to={href}
                          end={href === '/portal/writing'}
                          onClick={() => setMobileNavOpen(false)}
                          className={({ isActive }) => `flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-red-700 ${
                            isActive
                              ? 'border-red-800 bg-red-800 text-white shadow-md shadow-red-950/20'
                              : darkMode
                                ? 'border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/10'
                                : 'border-[#eaded0] bg-white text-zinc-800 hover:bg-[#fffaf0]'
                          }`}
                        >
                          <span className="inline-flex items-center gap-3"><Icon size={17} />{label}</span>
                          <span aria-hidden="true">&rarr;</span>
                        </NavLink>
                      ))}
                    </nav>
                  </section>
                </div>
              ) : null}
            </>
          ) : null}

          <div className={hideNavigation ? '' : compact ? 'mt-6' : 'mt-8'}>{children}</div>
        </section>
      </main>
      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default WritingStudioShell;
