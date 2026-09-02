import type { LucideIcon } from 'lucide-react';
import { HelpCircle, Moon, Settings } from 'lucide-react';

import { siteIcons } from '../../constants/siteIcons';

export type NavigationSectionId = 'main' | 'community' | 'preferences';
export type NavigationMatch = 'exact' | 'prefix' | 'explicit';
export type NavigationItemType = 'route' | 'action' | 'external';

export type NavigationItem = {
  activePaths?: string[];
  href?: string;
  icon: LucideIcon;
  id: string;
  label: string;
  match?: NavigationMatch;
  section?: NavigationSectionId;
  type: NavigationItemType;
};

export const publicNavigationSections: Array<{
  id: NavigationSectionId;
  items: NavigationItem[];
  label: string;
}> = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { id: 'home', label: 'Home', href: '/', icon: siteIcons.home, match: 'exact', section: 'main', type: 'route' },
      { id: 'scripture', label: 'Scripture', href: '/scripture', icon: siteIcons.scripture, match: 'prefix', section: 'main', type: 'route' },
      { id: 'project52', label: 'Project 52', href: '/project52', icon: siteIcons.project52, match: 'prefix', section: 'main', type: 'route' },
      { id: 'resources', label: 'Resources', href: '/resources', icon: siteIcons.resources, match: 'prefix', section: 'main', type: 'route' },
      { id: 'media', label: 'Media', href: '/media', icon: siteIcons.media, match: 'prefix', section: 'main', type: 'route' },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    items: [
      { id: 'ministries', label: 'Ministries', href: '/ministries', icon: siteIcons.ministries, match: 'prefix', section: 'community', type: 'route' },
      { id: 'events', label: 'Events', href: '/events', icon: siteIcons.events, match: 'prefix', section: 'community', type: 'route' },
      { id: 'about', label: 'About', href: '/about', icon: siteIcons.about, match: 'prefix', section: 'community', type: 'route' },
      { id: 'contact', label: 'Contact', href: '/contact', icon: siteIcons.contact, match: 'prefix', section: 'community', type: 'route' },
    ],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    items: [
      { id: 'theme', label: 'Dark theme', icon: Moon, section: 'preferences', type: 'action' },
      { id: 'settings', label: 'Settings', href: '/settings', icon: Settings, match: 'prefix', section: 'preferences', type: 'route' },
      { id: 'help', label: 'Help', href: '/help', icon: HelpCircle, match: 'prefix', section: 'preferences', type: 'route' },
    ],
  },
];

export const giveNavigationItem: NavigationItem = {
  href: '/give',
  icon: siteIcons.giving,
  id: 'give',
  label: 'Give',
  match: 'exact',
  type: 'route',
};

export const accountNavigationItems: NavigationItem[] = [
  { id: 'profile', label: 'Profile', href: '/account/profile', icon: siteIcons.account, match: 'exact', type: 'route' },
  { id: 'account', label: 'My Account', href: '/account', icon: siteIcons.account, match: 'exact', type: 'route' },
];

export const portalNavigationItem: NavigationItem = {
  href: '/portal',
  icon: siteIcons.dashboard,
  id: 'portal',
  label: 'Enter Staff Portal',
  match: 'exact',
  type: 'route',
};

const normalizePathname = (pathname: string) => {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '');
};

export const isNavigationItemActive = (item: NavigationItem, pathname: string) => {
  if (item.type !== 'route' || !item.href) return false;
  const current = normalizePathname(pathname);
  const destination = normalizePathname(item.href);

  if (item.match === 'explicit') {
    return item.activePaths?.some((path) => normalizePathname(path) === current) ?? false;
  }
  if (item.match === 'prefix') {
    return current === destination || current.startsWith(`${destination}/`);
  }
  return current === destination;
};

export const publicRouteItems = publicNavigationSections.flatMap((section) =>
  section.items.filter((item) => item.type === 'route'),
);

export const getActivePublicNavigationItem = (pathname: string) =>
  [...publicRouteItems, giveNavigationItem].find((item) => isNavigationItemActive(item, pathname)) ?? null;
