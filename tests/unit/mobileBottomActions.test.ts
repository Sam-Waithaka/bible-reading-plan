import { describe, expect, it } from 'vitest';

import {
  getMobileGiveMode,
  isMobileGiveRouteAllowed,
} from '../../src/components/navigation/mobileBottomActionPolicy';

describe('mobile bottom action policy', () => {
  it.each(['/scripture', '/scripture/john/3', '/give', '/portal', '/portal/writing'])('prohibits Give for %s', (pathname) => {
    expect(isMobileGiveRouteAllowed(pathname)).toBe(false);
    expect(getMobileGiveMode({ hasPageAction: true, pathname })).toBe('hidden');
  });

  it.each(['/', '/resources', '/media', '/project52'])('allows Give for %s', (pathname) => {
    expect(isMobileGiveRouteAllowed(pathname)).toBe(true);
  });

  it('selects standalone, paired, and blocked modes semantically', () => {
    expect(getMobileGiveMode({ hasPageAction: false, pathname: '/' })).toBe('standalone');
    expect(getMobileGiveMode({ hasPageAction: true, pathname: '/resources' })).toBe('paired');
    expect(getMobileGiveMode({ blocked: true, hasPageAction: true, pathname: '/resources' })).toBe('hidden');
  });
});
