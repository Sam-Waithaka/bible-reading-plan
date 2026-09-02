import { siteIcons } from '../../constants/siteIcons';
import { canAccessWritingStudio } from '../../utils/permissions';
import { isNavigationItemActive, type NavigationItem } from './navigationModel';

export type PortalNavigationCapabilities = {
  hasPortalAccess: boolean;
  permissions: string[];
};

type PortalNavigationItem = NavigationItem & {
  isVisible: (capabilities: PortalNavigationCapabilities) => boolean;
};

export type PortalNavigationSection = {
  id: 'portal';
  items: PortalNavigationItem[];
  label: 'Portal';
};

const portalNavigationSections: PortalNavigationSection[] = [
  {
    id: 'portal',
    label: 'Portal',
    items: [
      {
        href: '/portal',
        icon: siteIcons.dashboard,
        id: 'portal-dashboard',
        isVisible: ({ hasPortalAccess }) => hasPortalAccess,
        label: 'Dashboard',
        match: 'exact',
        type: 'route',
      },
      {
        href: '/portal/writing',
        icon: siteIcons.resources,
        id: 'portal-writing-studio',
        isVisible: ({ hasPortalAccess, permissions }) =>
          hasPortalAccess && canAccessWritingStudio(permissions),
        label: 'Writing Studio',
        match: 'prefix',
        type: 'route',
      },
    ],
  },
];

export const getVisiblePortalNavigationSections = (
  capabilities: PortalNavigationCapabilities,
) => portalNavigationSections
  .map((section) => ({
    ...section,
    items: section.items.filter((item) => item.isVisible(capabilities)),
  }))
  .filter((section) => section.items.length > 0);

export const getActivePortalNavigationItem = (
  pathname: string,
  capabilities: PortalNavigationCapabilities,
) => getVisiblePortalNavigationSections(capabilities)
  .flatMap((section) => section.items)
  .find((item) => isNavigationItemActive(item, pathname)) ?? null;

