import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { assetPaths } from '../../constants/assets';
import { AccountIcon, GivingIcon, siteIcons } from '../../constants/siteIcons';
import { useCompactHeader } from '../../hooks/useCompactHeader';
import { useNearSiteFooter } from '../../hooks/useNearSiteFooter';
import { useAuth } from '../../hooks/useAuth';
import { canAccessWritingStudio } from '../../utils/permissions';
import SignInModal from '../auth/SignInModal';
import {
  getMobileGiveMode,
  mobileGiveActionStyle,
} from './mobileBottomActionPolicy';
import { useMobileBottomActions } from './mobileBottomActionContext';
import {
  accountNavigationItems,
  giveNavigationItem,
  isNavigationItemActive,
  portalNavigationItem,
  publicNavigationSections,
  type NavigationItem,
} from './navigationModel';

type SiteNavigationProps = {
  compact?: boolean;
  darkMode: boolean;
  layout: 'top' | 'side';
  onToggleTheme: () => void;
  sticky?: boolean;
};

type NavigationShape = 'drawer' | 'side' | 'top';

const churchWebsiteUrl = 'https://aicnjoro.org';
const mainSection = publicNavigationSections.find((section) => section.id === 'main')!;
const communitySection = publicNavigationSections.find((section) => section.id === 'community')!;
const preferencesSection = publicNavigationSections.find((section) => section.id === 'preferences')!;
const topNavigationItems = [...mainSection.items, ...communitySection.items];

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A';

const SiteNavigation = ({
  compact,
  darkMode,
  layout,
  onToggleTheme,
  sticky = true,
}: SiteNavigationProps) => {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(true);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);
  const drawerCloseRef = useRef<HTMLButtonElement | null>(null);
  const drawerScrollRef = useRef<HTMLElement | null>(null);
  const drawerTriggerRef = useRef<HTMLElement | null>(null);
  const observedCompactHeader = useCompactHeader(layout === 'top' && compact === undefined, { observeNestedScroll: true });
  const compactSmallHeader = compact ?? observedCompactHeader;
  const nearSiteFooter = useNearSiteFooter();
  const portalContext = location.pathname === '/portal' || location.pathname.startsWith('/portal/');
  const accountName = auth.user
    ? [auth.user.firstName, auth.user.lastName].filter(Boolean).join(' ') || auth.user.username || 'Account'
    : '';
  const accountLabel = auth.user?.firstName || accountName;
  const accountInitials = initialsFor(accountName);
  const avatarUrl = auth.user?.profile?.profilePhoto;
  const canEnterPortal = auth.hasPortalAccess;
  const { hasBlockingOverlay, hasPageAction } = useMobileBottomActions();
  const mobileGiveMode = getMobileGiveMode({
    blocked: drawerOpen || signInOpen || hasBlockingOverlay || fullscreenActive,
    hasPageAction,
    pathname: location.pathname,
  });

  const openDrawer = (trigger: HTMLElement) => {
    drawerTriggerRef.current = trigger;
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerScrollRef.current?.scrollTo?.({ top: 0 });
    window.requestAnimationFrame(() => drawerCloseRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
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
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      drawerTriggerRef.current?.focus();
    };
  }, [drawerOpen]);

  useEffect(() => {
    const updateFullscreenState = () => setFullscreenActive(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  const getNavItemClass = (active: boolean, shape: NavigationShape) => {
    const shapeClass = {
      drawer: 'flex min-h-12 items-center gap-3 rounded-2xl border-l-4 px-4 text-sm font-bold transition',
      side: 'flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-bold transition',
      top: 'inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-xs font-bold transition 2xl:gap-2 2xl:px-3 2xl:text-sm',
    }[shape];
    const stateClass = shape === 'drawer'
      ? active
        ? darkMode
          ? 'border-red-200/70 bg-white/[0.06] text-red-100'
          : 'border-red-800 bg-red-950/5 text-red-900'
        : darkMode
          ? 'border-transparent text-stone-300 hover:bg-white/10'
          : 'border-transparent text-zinc-700 hover:bg-white'
      : active
        ? 'bg-red-800 text-white shadow-md shadow-red-950/20'
        : darkMode
          ? 'text-stone-300 hover:bg-white/10'
          : 'text-zinc-700 hover:bg-white';
    return `${shapeClass} ${stateClass}`;
  };

  const getUtilityItemClass = (shape: 'drawer' | 'side') => {
    const dimensions = shape === 'drawer'
      ? 'flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-bold transition'
      : 'flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition';
    return `${dimensions} ${darkMode ? 'text-stone-300 hover:bg-white/10' : 'text-zinc-700 hover:bg-white'}`;
  };

  const renderNavItem = (item: NavigationItem, shape: NavigationShape, onClick?: () => void) => {
    const Icon = item.icon;
    const active = isNavigationItemActive(item, location.pathname);
    if (item.type === 'action') {
      return (
        <button key={item.id} type="button" onClick={onToggleTheme} className={getUtilityItemClass(shape === 'top' ? 'side' : shape)}>
          {darkMode ? <Sun size={shape === 'drawer' ? 18 : 17} /> : <Moon size={shape === 'drawer' ? 18 : 17} />}
          {darkMode ? 'Light theme' : 'Dark theme'}
        </button>
      );
    }
    if (!item.href) return null;
    const content = (
      <>
        {shape !== 'top' ? <Icon size={shape === 'drawer' ? 18 : 17} aria-hidden="true" /> : null}
        {item.label}
      </>
    );
    return item.type === 'external' ? (
      <a key={item.id} href={item.href} className={getNavItemClass(active, shape)} onClick={onClick}>{content}</a>
    ) : (
      <Link key={item.id} to={item.href} aria-current={active ? 'page' : undefined} className={getNavItemClass(active, shape)} onClick={onClick}>{content}</Link>
    );
  };

  const renderGiveButton = (shape: NavigationShape, onClick?: () => void) => (
    <Link
      to={giveNavigationItem.href!}
      onClick={onClick}
      aria-current={isNavigationItemActive(giveNavigationItem, location.pathname) ? 'page' : undefined}
      className={`${{
        drawer: 'flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black transition',
        side: 'flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-bold transition',
        top: 'inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-black transition hover:-translate-y-0.5',
      }[shape]} ${darkMode ? 'bg-[#fffaf0] text-zinc-950 shadow-md shadow-white/10 hover:bg-white' : 'bg-[#080808] text-white shadow-md shadow-zinc-950/20 hover:bg-[#111111]'} ${isNavigationItemActive(giveNavigationItem, location.pathname) ? 'ring-2 ring-red-700 ring-offset-2 ring-offset-transparent' : ''}`}
    >
      <GivingIcon size={shape === 'top' ? 16 : shape === 'drawer' ? 18 : 17} aria-hidden="true" />
      Give
    </Link>
  );

  const renderSectionTitle = (label: string, id: string, shape: 'drawer' | 'side') => (
    <p id={`${shape}-nav-${id}`} className={`mb-2 px-2 text-[11px] font-black uppercase tracking-[0.16em] ${darkMode ? 'text-stone-500' : 'text-zinc-500'}`}>
      {label}
    </p>
  );

  const renderSection = (section: typeof mainSection, shape: 'drawer' | 'side', collapsible = false, open = true, toggle?: () => void) => (
    <section key={section.id} aria-labelledby={`${shape}-nav-${section.id}`}>
      {collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${shape}-nav-${section.id}-items`}
          onClick={toggle}
          className={`mb-2 flex w-full items-center justify-between rounded-xl px-2 py-1 text-left text-[11px] font-black uppercase tracking-[0.16em] ${darkMode ? 'text-stone-500 hover:bg-white/5' : 'text-zinc-500 hover:bg-black/[0.03]'}`}
        >
          {section.label}
          <ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} size={15} aria-hidden="true" />
        </button>
      ) : renderSectionTitle(section.label, section.id, shape)}
      <div id={`${shape}-nav-${section.id}-items`} hidden={collapsible && !open} className="grid gap-2">
        {section.items.map((item) => renderNavItem(item, shape, shape === 'drawer' ? closeDrawer : undefined))}
      </div>
    </section>
  );

  const renderIdentityCard = (shape: 'drawer' | 'side') => auth.user ? (
    <div className={`rounded-2xl border p-3 ${shape === 'drawer' ? 'mt-4' : 'mt-5'} ${darkMode ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-white/70'}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl text-xs font-black ${darkMode ? 'bg-red-950/60 text-red-100' : 'bg-red-950/5 text-red-800'}`}>
          {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : accountInitials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{accountName}</p>
          <p className={`truncate text-[11px] ${darkMode ? 'text-stone-400' : 'text-zinc-600'}`}>{auth.user.email || auth.user.username || auth.user.phoneNumber}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs font-bold">
        <Link to="/account" onClick={shape === 'drawer' ? closeDrawer : undefined} className={darkMode ? 'text-stone-300' : 'text-zinc-700'}>My Account</Link>
        {canEnterPortal ? (
          <Link to="/portal" onClick={shape === 'drawer' ? closeDrawer : undefined} className="inline-flex items-center gap-1 text-red-800 dark:text-red-200">
            Portal <ChevronRight size={13} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  ) : null;

  const renderAccountSection = (shape: 'drawer' | 'side') => auth.user ? (
    <section aria-labelledby={`${shape}-nav-account`}>
      {renderSectionTitle('Account', 'account', shape)}
      <div className="grid gap-2">
        {accountNavigationItems.map((item) => renderNavItem(item, shape, shape === 'drawer' ? closeDrawer : undefined))}
        {canEnterPortal ? renderNavItem(portalNavigationItem, shape, shape === 'drawer' ? closeDrawer : undefined) : null}
      </div>
    </section>
  ) : null;

  const renderLogout = (shape: 'drawer' | 'side') => auth.user ? (
    <button
      type="button"
      onClick={async () => {
        closeDrawer();
        await auth.signOut();
        navigate('/');
      }}
      className={`${getUtilityItemClass(shape)} border-t ${darkMode ? 'border-white/10 text-stone-400' : 'border-black/10 text-zinc-600'}`}
    >
      <LogOut size={shape === 'drawer' ? 18 : 17} aria-hidden="true" /> Logout
    </button>
  ) : (
    <button type="button" onClick={() => { closeDrawer(); setSignInOpen(true); }} className={getUtilityItemClass(shape)}>
      <AccountIcon size={shape === 'drawer' ? 18 : 17} aria-hidden="true" /> Sign in
    </button>
  );

  const renderPublicNavigation = (shape: 'drawer' | 'side') => (
    <>
      {renderSection(mainSection, shape)}
      <section aria-label="Give" className="grid gap-2">{renderGiveButton(shape, shape === 'drawer' ? closeDrawer : undefined)}</section>
      {renderSection(communitySection, shape, shape === 'drawer', communityOpen, () => setCommunityOpen((value) => !value))}
      {renderAccountSection(shape)}
      {renderSection(preferencesSection, shape, shape === 'drawer', preferencesOpen, () => setPreferencesOpen((value) => !value))}
      {renderLogout(shape)}
    </>
  );

  const renderPortalNavigation = (shape: 'drawer' | 'side') => (
    <>
      <section aria-labelledby={`${shape}-nav-portal`}>
        {renderSectionTitle('Staff Portal', 'portal', shape)}
        <div className="grid gap-2">
          {renderNavItem(portalNavigationItem, shape, shape === 'drawer' ? closeDrawer : undefined)}
          {canAccessWritingStudio(auth.permissions)
            ? renderNavItem({ id: 'writing-studio', label: 'Writing Studio', href: '/portal/writing', icon: siteIcons.resources, match: 'prefix', type: 'route' }, shape, shape === 'drawer' ? closeDrawer : undefined)
            : null}
          {renderNavItem({ id: 'back-to-site', label: 'Back to Site', href: '/', icon: siteIcons.home, match: 'exact', type: 'route' }, shape, shape === 'drawer' ? closeDrawer : undefined)}
        </div>
      </section>
      {renderAccountSection(shape)}
      {renderSection(preferencesSection, shape, shape === 'drawer', preferencesOpen, () => setPreferencesOpen((value) => !value))}
      {renderLogout(shape)}
    </>
  );

  if (layout === 'side') {
    return (
      <aside className={`hidden h-screen w-60 shrink-0 border-r px-4 py-5 lg:flex lg:flex-col ${darkMode ? 'border-white/10 bg-[#080808] text-stone-100' : 'border-black/10 bg-[#fffaf0] text-zinc-950'}`}>
        <a href={churchWebsiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700" aria-label="Open the AIC Njoro Town website">
          <img src={assetPaths.circleLogo} alt="" className="size-10 rounded-2xl bg-white object-contain p-1 shadow-sm" />
          <p className="truncate text-sm font-black leading-tight">A.I.C Njoro<br />Town</p>
        </a>
        {renderIdentityCard('side')}
        <nav className="mt-6 grid min-h-0 flex-1 content-start gap-6 overflow-y-auto overscroll-contain pb-4" aria-label="Site navigation">
          {renderPublicNavigation('side')}
        </nav>
      </aside>
    );
  }

  const renderAccountMenu = () => auth.user ? (
    <div className="relative hidden xl:block">
      <button type="button" onClick={() => setAccountOpen((value) => !value)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-2.5 pr-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 ${darkMode ? 'border-white/10 bg-white/10 text-stone-100 focus:ring-offset-black hover:bg-white/15' : 'border-black/10 bg-white text-zinc-900 shadow-zinc-900/5 focus:ring-offset-[#f8f5ef] hover:bg-[#fffaf0]'}`} aria-expanded={accountOpen} aria-haspopup="menu">
        <span className={`grid size-8 place-items-center overflow-hidden rounded-full ${darkMode ? 'bg-red-950/60 text-red-100' : 'bg-red-950/5 text-red-800'}`}>{avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : accountInitials}</span>
        <span className="max-w-28 truncate">{accountLabel}</span><ChevronDown size={15} aria-hidden="true" />
      </button>
      {accountOpen ? (
        <div className={`absolute right-0 top-full z-40 mt-3 w-64 rounded-2xl border p-2 shadow-2xl ${darkMode ? 'border-white/10 bg-zinc-950 text-stone-100 shadow-black/40' : 'border-black/10 bg-white text-zinc-950 shadow-zinc-900/15'}`} role="menu">
          <div className={`mb-2 rounded-xl px-3 py-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-[#f8f5ef]'}`}><p className="truncate text-sm font-black">{accountName}</p><p className={`truncate text-xs ${darkMode ? 'text-stone-400' : 'text-zinc-500'}`}>{auth.user.email || auth.user.phoneNumber}</p></div>
          {accountNavigationItems.map((item) => renderNavItem(item, 'side', () => setAccountOpen(false)))}
          {canEnterPortal ? renderNavItem(portalNavigationItem, 'side', () => setAccountOpen(false)) : null}
          <button type="button" onClick={onToggleTheme} className={getUtilityItemClass('side')}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}{darkMode ? 'Light theme' : 'Dark theme'}</button>
          <button type="button" onClick={async () => { setAccountOpen(false); await auth.signOut(); navigate('/'); }} className={getUtilityItemClass('side')}><LogOut size={17} /> Logout</button>
        </div>
      ) : null}
    </div>
  ) : (
    <button type="button" onClick={() => setSignInOpen(true)} className={`hidden size-11 place-items-center rounded-full border transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 xl:grid ${darkMode ? 'border-white/10 bg-white/10 text-stone-100 focus:ring-offset-black hover:bg-white/15' : 'border-black/10 bg-white text-zinc-700 shadow-sm focus:ring-offset-[#f8f5ef] hover:bg-[#fffaf0]'}`} aria-label="Sign in"><AccountIcon size={18} /></button>
  );

  return (
    <>
      <div className={`pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-4 py-3 transition-all duration-300 ease-out md:hidden ${drawerOpen ? '-translate-y-3 opacity-0' : compactSmallHeader ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`} aria-hidden={!compactSmallHeader || drawerOpen}>
        <a href={churchWebsiteUrl} target="_blank" rel="noopener noreferrer" className={`${compactSmallHeader ? 'pointer-events-auto' : 'pointer-events-none'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700`} aria-label="Open the AIC Njoro Town website"><img src={assetPaths.circleLogo} alt="" className="size-11 rounded-2xl border border-red-900/15 bg-white object-contain p-1 shadow-md" /></a>
        <button type="button" onClick={(event) => openDrawer(event.currentTarget)} className={`${compactSmallHeader ? 'pointer-events-auto' : 'pointer-events-none'} grid size-11 place-items-center rounded-full border shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-red-700 ${darkMode ? 'border-white/15 bg-white/10 text-stone-100' : 'border-black/10 bg-white/70 text-zinc-900'}`} aria-label="Open navigation menu"><Menu size={21} /></button>
      </div>

      <header className={`${sticky ? 'sticky top-0' : 'relative'} z-30 border-b backdrop-blur-xl transition-all duration-300 ${drawerOpen || compactSmallHeader ? 'max-md:max-h-0 max-md:-translate-y-full max-md:overflow-hidden max-md:border-b-0 max-md:opacity-0' : 'max-md:max-h-24 max-md:translate-y-0 max-md:opacity-100'} ${darkMode ? 'border-white/10 bg-black/75' : 'border-black/10 bg-[#f8f5ef]/85'}`}>
        <div className="relative mx-auto grid w-full max-w-none grid-cols-[auto_1fr_auto] items-center gap-6 px-4 py-3 sm:px-6 xl:px-8">
          <a href={churchWebsiteUrl} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700" aria-label="Open the AIC Njoro Town website">
            <img src={assetPaths.circleLogo} alt="" className="size-12 shrink-0 rounded-2xl border border-red-900/15 bg-white object-contain p-1 shadow-sm" />
            <div className="min-w-0"><p className="truncate text-lg font-extrabold leading-tight sm:text-xl">A.I.C Njoro Town</p><p className={`truncate font-serif text-xs sm:text-sm ${darkMode ? 'text-stone-400' : 'text-zinc-600'}`}>Oh Come Let Us Worship - Psalm 95:6</p></div>
          </a>
          <div className="hidden min-w-0 items-center justify-center gap-2 xl:flex 2xl:gap-3">
            {portalContext ? (
              <div className="flex items-center gap-4"><span className="text-xs font-black uppercase tracking-[0.18em] text-red-800 dark:text-red-200">Staff Portal</span><Link to="/" className={getNavItemClass(false, 'top')}>Back to Site</Link></div>
            ) : (
              <><nav className="flex items-center gap-1" aria-label="Site navigation">{topNavigationItems.map((item) => renderNavItem(item, 'top'))}</nav>{renderGiveButton('top')}</>
            )}
          </div>
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 shrink-0 items-center justify-end gap-3 xl:static xl:translate-y-0">
            {renderAccountMenu()}
            {!auth.user ? <button type="button" onClick={onToggleTheme} className={`hidden size-11 place-items-center rounded-full border xl:grid ${darkMode ? 'border-white/10 bg-white/10 text-stone-100' : 'border-black/10 bg-white text-zinc-700'}`} aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button> : null}
            <button type="button" onClick={(event) => openDrawer(event.currentTarget)} aria-hidden={compactSmallHeader || drawerOpen} tabIndex={compactSmallHeader || drawerOpen ? -1 : undefined} className={`grid size-11 place-items-center rounded-full border focus:outline-none focus:ring-2 focus:ring-red-700 xl:hidden ${darkMode ? 'border-white/10 bg-white/10 text-stone-100' : 'border-black/10 bg-white text-zinc-900'}`} aria-label="Open navigation menu"><Menu size={21} /></button>
          </div>
        </div>
      </header>

      {mobileGiveMode !== 'hidden' ? (
        <Link
          to="/give"
          data-mobile-bottom-action="give"
          data-mobile-bottom-action-mode={mobileGiveMode}
          className={`fixed z-[45] inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-black shadow-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 xl:hidden ${nearSiteFooter ? 'pointer-events-none translate-y-6 opacity-0' : 'translate-y-0 opacity-100'} ${darkMode ? 'bg-[#fffaf0] text-zinc-950' : 'bg-[#080808] text-white'}`}
          style={{ ...mobileGiveActionStyle, width: 'var(--mobile-give-action-width)' }}
          aria-label="Give"
        >
          <GivingIcon size={17} aria-hidden="true" /> Give
        </Link>
      ) : null}

      {drawerOpen ? (
        <div className="fixed inset-0 z-[70] xl:hidden" role="presentation">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={closeDrawer} aria-label="Close navigation menu" />
          <aside ref={drawerRef} className={`absolute right-0 top-0 flex h-full w-[min(88vw,24rem)] flex-col border-l px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl ${darkMode ? 'border-white/10 bg-zinc-950 text-stone-100 shadow-black/40' : 'border-black/10 bg-[#fffaf0] text-zinc-950 shadow-zinc-900/15'}`} role="dialog" aria-modal="true" aria-label={portalContext ? 'Staff Portal navigation' : 'Site navigation'}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3"><img src={assetPaths.circleLogo} alt="" className="size-11 rounded-2xl border border-red-900/15 bg-white object-contain p-1 shadow-sm" /><div className="min-w-0"><p className="truncate text-base font-extrabold">AIC Njoro Town</p>{portalContext ? <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-800 dark:text-red-200">Staff Portal</p> : null}</div></div>
              <button ref={drawerCloseRef} type="button" onClick={closeDrawer} className={`grid size-10 shrink-0 place-items-center rounded-full border ${darkMode ? 'border-white/10 bg-white/10' : 'border-black/10 bg-white'}`} aria-label="Close navigation menu"><X size={19} /></button>
            </div>
            {renderIdentityCard('drawer')}
            <nav ref={drawerScrollRef} className="mt-6 grid min-h-0 flex-1 content-start gap-6 overflow-y-auto overscroll-contain pb-2" aria-label={portalContext ? 'Staff Portal navigation' : 'Mobile site navigation'}>
              {portalContext ? renderPortalNavigation('drawer') : renderPublicNavigation('drawer')}
            </nav>
          </aside>
        </div>
      ) : null}
      <SignInModal darkMode={darkMode} open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
};

export default SiteNavigation;
