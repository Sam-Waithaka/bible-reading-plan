import { AccountIcon, GivingIcon, siteIcons } from '../constants/siteIcons';
import {
  ChevronDown,
  HelpCircle,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import SignInModal from './auth/SignInModal';
import { assetPaths } from '../constants/assets';

import { useCompactHeader } from '../hooks/useCompactHeader';
import { useAuth } from '../hooks/useAuth';

export type SiteNavPath =
  | '/'
  | '/about'
  | '/contact'
  | '/give'
  | '/media'
  | '/ministries'
  | '/portal'
  | '/resources'
  | '/scripture'
  | '/project52';

type SiteNavigationProps = {
  activePath?: SiteNavPath;
  compact?: boolean;
  darkMode: boolean;
  layout: 'top' | 'side';
  onToggleTheme: () => void;
  sticky?: boolean;
};

type SiteNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navItems: SiteNavItem[] = [
  { label: 'Home', href: '/', icon: siteIcons.home },
  { label: 'Scripture', href: '/scripture', icon: siteIcons.scripture },
  { label: 'Project 52', href: '/project52', icon: siteIcons.project52 },
  { label: 'Resources', href: '/resources', icon: siteIcons.resources },
  { label: 'Media', href: '/media', icon: siteIcons.media },
  { label: 'Ministries', href: '/ministries', icon: siteIcons.ministries },
  { label: 'About', href: '/about', icon: siteIcons.about },
  { label: 'Contact', href: '/contact', icon: siteIcons.contact },
];
const giveNavItem: SiteNavItem = { label: 'Give', href: '/give', icon: siteIcons.giving };
const signInNavItem: SiteNavItem = { label: 'Sign in', href: '#portal-sign-in', icon: siteIcons.account };
const mobileMainNavItems = navItems.slice(0, 5);
const mobileCommunityNavItems: SiteNavItem[] = [
  { label: 'Ministries', href: '/ministries', icon: siteIcons.ministries },
  { label: 'Events', href: '#', icon: siteIcons.events },
  { label: 'About', href: '/about', icon: siteIcons.about },
  { label: 'Contact', href: '/contact', icon: siteIcons.contact },
];
const mobileAccountNavItems: SiteNavItem[] = [
  { label: 'Portal Dashboard', href: '/portal', icon: siteIcons.dashboard },
  { label: 'Profile', href: '/portal#profile', icon: siteIcons.account },
  { label: 'My Account', href: '/portal#account', icon: siteIcons.account },
];
const mobileNavSections: { title: string; items: SiteNavItem[] }[] = [
  {
    title: 'Explore',
    items: [
      { label: 'Home', href: '/', icon: siteIcons.home },
      { label: 'About', href: '/about', icon: siteIcons.about },
      { label: 'Contact', href: '/contact', icon: siteIcons.contact },
    ],
  },
  {
    title: 'Spiritual Growth',
    items: [
      { label: 'Scripture', href: '/scripture', icon: siteIcons.scripture },
      { label: 'Project 52', href: '/project52', icon: siteIcons.project52 },
      { label: 'Resources', href: '/resources', icon: siteIcons.resources },
      { label: 'Media', href: '/media', icon: siteIcons.media },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Ministries', href: '/ministries', icon: siteIcons.ministries },
      { label: 'Events', href: '#', icon: siteIcons.events },
    ],
  },
  {
    title: 'Actions',
    items: [giveNavItem],
  },
];

const churchWebsiteUrl = 'https://aicnjoro.org';
const isRouteHref = (href: string) => href.startsWith('/');
const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A';

const SiteNavigation = ({
  activePath,
  compact,
  darkMode,
  layout,
  onToggleTheme,
  sticky = true,
}: SiteNavigationProps) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const observedCompactHeader = useCompactHeader(layout === 'top' && compact === undefined, { observeNestedScroll: true });
  const compactSmallHeader = compact ?? observedCompactHeader;
  const isActive = (href: string) => href === activePath;
  const accountName = auth.user
    ? [auth.user.firstName, auth.user.lastName].filter(Boolean).join(' ') || auth.user.username || 'Account'
    : '';
  const accountLabel = auth.user?.firstName || accountName;
  const accountInitials = initialsFor(accountName);
  const avatarUrl = auth.user?.profile?.profilePhoto;
  const getNavItemClass = (active: boolean, shape: 'side' | 'top' | 'drawer') => {
    const shapeClass = {
      side: 'flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-bold transition',
      top: 'inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold transition',
      drawer: 'flex min-h-12 items-center gap-3 rounded-2xl border-l-4 px-4 text-sm font-bold transition',
    }[shape];
    const stateClass =
      shape === 'drawer'
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
  const renderNavItem = (
    { href, icon: Icon, label }: SiteNavItem,
    shape: 'side' | 'top' | 'drawer',
    onClick?: () => void,
  ) => {
    if (isRouteHref(href)) {
      return (
        <NavLink
          key={label}
          to={href}
          end={href === '/'}
          onClick={onClick}
          className={({ isActive: routeActive }) => getNavItemClass(routeActive, shape)}
        >
          {shape !== 'top' && <Icon size={shape === 'drawer' ? 18 : 17} />}
          {label}
        </NavLink>
      );
    }

    return (
      <a key={label} href={href} onClick={onClick} className={getNavItemClass(isActive(href), shape)}>
        {shape !== 'top' && <Icon size={shape === 'drawer' ? 18 : 17} />}
        {label}
      </a>
    );
  };
  const renderGiveButton = (shape: 'side' | 'top' | 'drawer', onClick?: () => void) => (
    <NavLink
      key={giveNavItem.label}
      to={giveNavItem.href}
      onClick={onClick}
      className={({ isActive: routeActive }) => {
        const shapeClass = {
          side: 'flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-bold transition',
          top: 'inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-black transition hover:-translate-y-0.5',
          drawer: 'flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black transition',
        }[shape];
        const themeClass = darkMode
          ? 'bg-[#fffaf0] text-zinc-950 shadow-md shadow-white/10 hover:bg-white'
          : 'bg-[#080808] text-white shadow-md shadow-zinc-950/20 hover:bg-[#111111]';
        const activeClass = routeActive
          ? 'ring-2 ring-red-700 ring-offset-2 ring-offset-transparent'
          : '';

        return `${shapeClass} ${themeClass} ${activeClass}`;
      }}
    >
      <GivingIcon size={shape === 'top' ? 16 : shape === 'drawer' ? 18 : 17} />
      {giveNavItem.label}
    </NavLink>
  );
  const renderSectionTitle = (title: string, shape: 'side' | 'drawer') => (
    <p
      id={`${shape}-nav-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className={`mb-2 px-2 text-[11px] font-black uppercase tracking-[0.16em] ${
        darkMode ? 'text-stone-500' : 'text-zinc-500'
      }`}
    >
      {title}
    </p>
  );
  const getUtilityItemClass = (shape: 'side' | 'drawer', nested = false) => {
    const shapeClass =
      shape === 'drawer'
        ? nested
          ? 'ml-6 flex min-h-11 w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl px-4 text-left text-sm font-bold transition'
          : 'flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-bold transition'
        : nested
          ? 'ml-5 flex min-h-10 w-[calc(100%-1.25rem)] items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition'
          : 'flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition';
    const stateClass = darkMode ? 'text-stone-300 hover:bg-white/10' : 'text-zinc-700 hover:bg-white';

    return `${shapeClass} ${stateClass}`;
  };
  const renderPreferencesSection = (shape: 'side' | 'drawer') => (
    <section aria-labelledby={`${shape}-nav-preferences`}>
      {renderSectionTitle('Preferences', shape)}
      <div className="grid gap-2">
        <a href="#" className={getUtilityItemClass(shape)}>
          <Settings size={shape === 'drawer' ? 18 : 17} />
          Settings
        </a>
        <button
          type="button"
          onClick={() => {
            onToggleTheme();
            if (shape === 'drawer') {
              setDrawerOpen(false);
            }
          }}
          className={getUtilityItemClass(shape, true)}
        >
          {darkMode ? <Sun size={shape === 'drawer' ? 18 : 17} /> : <Moon size={shape === 'drawer' ? 18 : 17} />}
          {darkMode ? 'Light theme' : 'Dark theme'}
        </button>
        <a href="#" className={getUtilityItemClass(shape)}>
          <HelpCircle size={shape === 'drawer' ? 18 : 17} />
          Help
        </a>
      </div>
    </section>
  );
  const renderMobileSection = (title: string, items: SiteNavItem[], onRouteClick?: () => void) => (
    <section aria-labelledby={`drawer-nav-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {renderSectionTitle(title, 'drawer')}
      <div className="grid gap-2">{items.map((item) => renderNavItem(item, 'drawer', onRouteClick))}</div>
    </section>
  );
  const renderMobileUserCard = () =>
    auth.user && (
      <div
        className={`mt-6 rounded-3xl border p-4 shadow-sm ${
          darkMode ? 'border-white/10 bg-white/[0.04] shadow-black/20' : 'border-black/10 bg-white shadow-zinc-900/5'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl text-sm font-black ${
              darkMode ? 'bg-red-950/60 text-red-100' : 'bg-red-950/5 text-red-800'
            }`}
          >
            {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : accountInitials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{accountName}</p>
            <p className={`truncate text-xs ${darkMode ? 'text-stone-400' : 'text-zinc-600'}`}>
              {auth.user.email || auth.user.username || auth.user.phoneNumber}
            </p>
          </div>
        </div>
        <p
          className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${
            darkMode ? 'bg-white/10 text-stone-300' : 'bg-red-950/5 text-red-800'
          }`}
        >
          Signed in
        </p>
      </div>
    );
  const renderAuthenticatedMobileNavigation = (onRouteClick?: () => void) => (
    <>
      {renderMobileSection('Main', mobileMainNavItems, onRouteClick)}
      {renderMobileSection('Community', mobileCommunityNavItems, onRouteClick)}
      {renderMobileSection('Account', mobileAccountNavItems, onRouteClick)}
      <section aria-labelledby="drawer-nav-support">
        {renderSectionTitle('Support', 'drawer')}
        <div className="grid gap-2">{renderGiveButton('drawer', onRouteClick)}</div>
      </section>
      <section aria-labelledby="drawer-nav-preferences">
        {renderSectionTitle('Preferences', 'drawer')}
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => {
              onToggleTheme();
              setDrawerOpen(false);
            }}
            className={getUtilityItemClass('drawer')}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {darkMode ? 'Light theme' : 'Dark theme'}
          </button>
          <a href="#" className={getUtilityItemClass('drawer')}>
            <Settings size={18} />
            Settings
          </a>
          <a href="#" className={getUtilityItemClass('drawer')}>
            <HelpCircle size={18} />
            Help
          </a>
          <button
            type="button"
            onClick={async () => {
              setDrawerOpen(false);
              await auth.signOut();
              navigate('/');
            }}
            className={`${getUtilityItemClass('drawer')} mt-2 border-t pt-4 ${
              darkMode ? 'border-white/10 text-stone-400' : 'border-black/10 text-zinc-600'
            }`}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </section>
    </>
  );
  const renderGroupedNavigation = (shape: 'side' | 'drawer', onRouteClick?: () => void) => (
    <>
      {mobileNavSections.map((section) => (
        <section key={section.title} aria-labelledby={`${shape}-nav-${section.title.toLowerCase().replace(/\s+/g, '-')}`}>
          {renderSectionTitle(section.title, shape)}
          <div className="grid gap-2">
            {section.items.map((item) =>
              item.href === giveNavItem.href
                ? renderGiveButton(shape, onRouteClick)
                : renderNavItem(item, shape, onRouteClick),
            )}
            {section.title === 'Actions' && auth.user && (
              <>
                {renderNavItem({ label: 'Profile', href: '/portal#profile', icon: siteIcons.account }, shape, onRouteClick)}
                {renderNavItem({ label: 'My Account', href: '/portal#account', icon: siteIcons.account }, shape, onRouteClick)}
                {renderNavItem({ label: 'Portal Dashboard', href: '/portal', icon: siteIcons.dashboard }, shape, onRouteClick)}
                <button
                  type="button"
                  onClick={async () => {
                    setDrawerOpen(false);
                    await auth.signOut();
                    navigate('/');
                  }}
                  className={getUtilityItemClass(shape)}
                >
                  <LogOut size={shape === 'drawer' ? 18 : 17} />
                  Logout
                </button>
              </>
            )}
            {section.title === 'Actions' && !auth.user && (
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setSignInOpen(true);
                }}
                className={getUtilityItemClass(shape)}
              >
                <AccountIcon size={shape === 'drawer' ? 18 : 17} />
                {signInNavItem.label}
              </button>
            )}
          </div>
        </section>
      ))}
      {renderPreferencesSection(shape)}
    </>
  );

  if (layout === 'side') {
    return (
      <aside
        className={`hidden h-screen w-60 shrink-0 border-r px-4 py-5 lg:flex lg:flex-col ${
          darkMode ? 'border-white/10 bg-[#080808] text-stone-100' : 'border-black/10 bg-[#fffaf0] text-zinc-950'
        }`}
      >
        <a
          href={churchWebsiteUrl}
          target='_blank'
          rel='noopener noreferrer'
          className="flex items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700"
          aria-label="Open the AIC Njoro Town website"
        >
          <img src={assetPaths.circleLogo} alt="" className="size-10 rounded-2xl bg-white object-contain p-1 shadow-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-black leading-tight">
              A.I.C Njoro<br />
              Town
            </p>
            {/* <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${darkMode ? 'text-stone-400' : 'text-zinc-500'}`}> 
              Town
            </p> */}
          </div>
        </a>

        <nav className="mt-8 grid gap-6 overflow-y-auto pb-4" aria-label="Site navigation">
          {renderGroupedNavigation('side')}
        </nav>
      </aside>
    );
  }

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-4 py-3 transition-all duration-300 ease-out md:hidden ${
          drawerOpen
            ? '-translate-y-3 opacity-0'
            : compactSmallHeader
              ? 'translate-y-0 opacity-100'
              : '-translate-y-3 opacity-0'
        }`}
        aria-hidden={!compactSmallHeader || drawerOpen}
      >
          <a
            href={churchWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${compactSmallHeader ? 'pointer-events-auto' : 'pointer-events-none'} rounded-2xl transition-transform duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-red-700`}
            aria-label="Open the AIC Njoro Town website"
          >
            <img
              src={assetPaths.circleLogo}
              alt=""
              className={`size-11 rounded-2xl border object-contain p-1 shadow-md ${
                darkMode ? 'border-red-400/30 bg-white' : 'border-red-900/15 bg-white'
              }`}
            />
          </a>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`${compactSmallHeader ? 'pointer-events-auto' : 'pointer-events-none'} grid size-11 shrink-0 place-items-center rounded-full border shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 ${
              darkMode
                ? 'border-white/15 bg-white/10 text-stone-100 shadow-black/25 focus:ring-offset-black hover:bg-white/15'
                : 'border-black/10 bg-white/70 text-zinc-900 shadow-zinc-900/15 focus:ring-offset-[#f8f5ef] hover:bg-white/85'
            }`}
            aria-label="Open navigation menu"
          >
            <Menu size={21} />
          </button>
        </div>
      <header
        className={`${sticky ? 'sticky top-0' : 'relative'} z-30 border-b backdrop-blur-xl transition-all duration-300 ease-out ${
        drawerOpen
          ? 'max-md:max-h-0 max-md:-translate-y-full max-md:overflow-hidden max-md:border-b-0 max-md:opacity-0'
          : compactSmallHeader
            ? 'max-md:max-h-0 max-md:-translate-y-full max-md:overflow-hidden max-md:border-b-0 max-md:opacity-0'
            : 'max-md:max-h-24 max-md:translate-y-0 max-md:opacity-100'
      } ${
        darkMode ? 'border-white/10 bg-black/75' : 'border-black/10 bg-[#f8f5ef]/85'
      }`}
      >
        <div className="mx-auto grid w-full max-w-none grid-cols-[auto_1fr_auto] items-center gap-6 px-4 py-3 sm:px-6 xl:px-8">
        <a
          href={churchWebsiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-3 rounded-2xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
          aria-label="Open the AIC Njoro Town website"
        >
          <img
            src={assetPaths.circleLogo}
            alt=""
            className={`size-12 shrink-0 rounded-2xl border object-contain p-1 shadow-sm ${
              darkMode ? 'border-red-400/30 bg-white' : 'border-red-900/15 bg-white'
            }`}
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold leading-tight sm:text-xl">A.I.C Njoro Town</p>
            <p className={`truncate font-serif text-xs sm:text-sm ${darkMode ? 'text-stone-400' : 'text-zinc-600'}`}>
              Oh Come Let Us Worship - Psalm 95:6
            </p>
          </div>
        </a>
        <div className="hidden min-w-0 items-center justify-center gap-3 lg:flex">
          <nav className="flex items-center gap-1" aria-label="Site navigation">
            {navItems.map((item) => renderNavItem(item, 'top'))}
          </nav>
          {renderGiveButton('top')}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-3">
          {auth.user ? (
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setAccountOpen((current) => !current)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-2.5 pr-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 ${
                  darkMode
                    ? 'border-white/10 bg-white/10 text-stone-100 focus:ring-offset-black hover:bg-white/15'
                    : 'border-black/10 bg-white text-zinc-900 shadow-zinc-900/5 focus:ring-offset-[#f8f5ef] hover:bg-[#fffaf0]'
                }`}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className={`grid size-8 place-items-center overflow-hidden rounded-full ${darkMode ? 'bg-red-950/60 text-red-100' : 'bg-red-950/5 text-red-800'}`}>
                  {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : accountInitials}
                </span>
                <span className="max-w-28 truncate">{accountLabel}</span>
                <ChevronDown size={15} />
              </button>

              {accountOpen && (
                <div
                  className={`absolute right-0 top-full z-40 mt-3 w-64 rounded-2xl border p-2 shadow-2xl ${
                    darkMode
                      ? 'border-white/10 bg-zinc-950 text-stone-100 shadow-black/40'
                      : 'border-black/10 bg-white text-zinc-950 shadow-zinc-900/15'
                  }`}
                  role="menu"
                >
                  <div className={`mb-2 rounded-xl px-3 py-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-[#f8f5ef]'}`}>
                    <p className="truncate text-sm font-black">{accountName}</p>
                    <p className={`truncate text-xs ${darkMode ? 'text-stone-400' : 'text-zinc-500'}`}>{auth.user.email || auth.user.phoneNumber}</p>
                  </div>
                  {[
                    { href: '/portal#profile', icon: siteIcons.account, label: 'Profile' },
                    { href: '/portal#account', icon: siteIcons.account, label: 'My Account' },
                    { href: '/portal', icon: siteIcons.dashboard, label: 'Portal Dashboard' },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link
                      key={label}
                      to={href}
                      onClick={() => setAccountOpen(false)}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${
                        darkMode ? 'text-stone-300 hover:bg-white/10' : 'text-zinc-700 hover:bg-[#fffaf0]'
                      }`}
                      role="menuitem"
                    >
                      <Icon size={17} />
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleTheme();
                      setAccountOpen(false);
                    }}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${
                      darkMode ? 'text-stone-300 hover:bg-white/10' : 'text-zinc-700 hover:bg-[#fffaf0]'
                    }`}
                    role="menuitem"
                  >
                    {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                    {darkMode ? 'Light theme' : 'Dark theme'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setAccountOpen(false);
                      await auth.signOut();
                      navigate('/');
                    }}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${
                      darkMode ? 'text-stone-300 hover:bg-white/10' : 'text-zinc-700 hover:bg-[#fffaf0]'
                    }`}
                    role="menuitem"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className={`hidden size-11 place-items-center rounded-full border transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 lg:grid ${
                darkMode
                  ? 'border-white/10 bg-white/10 text-stone-100 focus:ring-offset-black hover:bg-white/15'
                  : 'border-black/10 bg-white text-zinc-700 shadow-sm focus:ring-offset-[#f8f5ef] hover:bg-[#fffaf0]'
              }`}
              aria-label="Sign in"
            >
              <AccountIcon size={18} />
            </button>
          )}
          {!auth.user && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`hidden size-11 place-items-center rounded-full border transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 lg:grid ${
                darkMode
                  ? 'border-white/10 bg-white/10 text-stone-100 focus:ring-offset-black hover:bg-white/15'
                  : 'border-black/10 bg-white text-zinc-700 shadow-sm focus:ring-offset-[#f8f5ef] hover:bg-[#fffaf0]'
              }`}
              aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-hidden={compactSmallHeader || drawerOpen}
            tabIndex={compactSmallHeader || drawerOpen ? -1 : undefined}
            className={`grid size-11 shrink-0 place-items-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 lg:hidden ${
              darkMode
                ? 'border-white/10 bg-white/10 text-stone-100 focus:ring-offset-black'
                : 'border-black/10 bg-white text-zinc-900 shadow-sm focus:ring-offset-[#f8f5ef]'
            }`}
            aria-label="Open navigation menu"
          >
            <Menu size={21} />
          </button>
        </div>
      </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside
            className={`absolute right-0 top-0 flex h-full w-[min(88vw,24rem)] flex-col border-l p-5 shadow-2xl ${
              darkMode
                ? 'border-white/10 bg-zinc-950 text-stone-100 shadow-black/40'
                : 'border-black/10 bg-[#fffaf0] text-zinc-950 shadow-zinc-900/15'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <a
                href={churchWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700"
                aria-label="Open the AIC Njoro Town website"
              >
                <img src={assetPaths.circleLogo} alt="" className="size-12 rounded-2xl border border-red-900/15 bg-white object-contain p-1 shadow-sm" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold leading-tight">AIC Njoro Town</p>
                  <p className={`truncate font-serif text-sm ${darkMode ? 'text-stone-400' : 'text-zinc-600'}`}>
                    Oh Come Let Us Worship - Psalm 95:6
                  </p>
                </div>
              </a>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className={`grid size-10 shrink-0 place-items-center rounded-full border ${
                  darkMode ? 'border-white/10 bg-white/10' : 'border-black/10 bg-white'
                }`}
                aria-label="Close navigation menu"
              >
                <X size={19} />
              </button>
            </div>

            {renderMobileUserCard()}

            <nav className="mt-8 grid gap-6 overflow-y-auto pb-4" aria-label="Mobile site navigation">
              {auth.user
                ? renderAuthenticatedMobileNavigation(() => setDrawerOpen(false))
                : renderGroupedNavigation('drawer', () => setDrawerOpen(false))}
            </nav>
          </aside>
        </div>
      )}
      <SignInModal darkMode={darkMode} open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
};

export default SiteNavigation;
