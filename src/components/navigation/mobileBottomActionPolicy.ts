import type { CSSProperties } from 'react';

export type MobileGiveMode = 'hidden' | 'paired' | 'standalone';

const isWithinRoute = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export const isMobileGiveRouteAllowed = (pathname: string) =>
  pathname !== '/give'
  && !isWithinRoute(pathname, '/scripture')
  && !isWithinRoute(pathname, '/portal');

export const getMobileGiveMode = ({
  blocked = false,
  hasPageAction,
  pathname,
}: {
  blocked?: boolean;
  hasPageAction: boolean;
  pathname: string;
}): MobileGiveMode => {
  if (blocked || !isMobileGiveRouteAllowed(pathname)) return 'hidden';
  return hasPageAction ? 'paired' : 'standalone';
};

export const mobileBottomActionBaselineStyle: CSSProperties = {
  bottom: 'calc(env(safe-area-inset-bottom) + var(--mobile-bottom-action-offset))',
};

export const mobileGiveActionStyle: CSSProperties = {
  ...mobileBottomActionBaselineStyle,
  right: 'var(--mobile-bottom-action-gutter)',
};

export const getMobilePageActionStyle = (reserveGive: boolean): CSSProperties => ({
  ...mobileBottomActionBaselineStyle,
  left: 'var(--mobile-bottom-action-gutter)',
  right: reserveGive
    ? 'calc(var(--mobile-bottom-action-gutter) + var(--mobile-give-action-width) + var(--mobile-bottom-action-gap))'
    : 'var(--mobile-bottom-action-gutter)',
});
