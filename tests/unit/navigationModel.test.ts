import { describe, expect, it } from 'vitest';

import {
  getActivePublicNavigationItem,
  isNavigationItemActive,
  publicNavigationSections,
} from '../../src/components/navigation/navigationModel';

describe('canonical navigation model', () => {
  it('keeps the agreed public ordering stable', () => {
    expect(publicNavigationSections.map(({ id }) => id)).toEqual(['main', 'community', 'preferences']);
    expect(publicNavigationSections[0].items.map(({ label }) => label)).toEqual([
      'Home', 'Scripture', 'Project 52', 'Resources', 'Media',
    ]);
    expect(publicNavigationSections[1].items.map(({ label }) => label)).toEqual([
      'Ministries', 'Events', 'About', 'Contact',
    ]);
    expect(publicNavigationSections[2].items.map(({ label }) => label)).toEqual([
      'Dark theme', 'Settings', 'Help',
    ]);
  });

  it.each([
    ['/', 'home'],
    ['/resources/type/insights', 'resources'],
    ['/media/watch/a-message', 'media'],
    ['/scripture', 'scripture'],
    ['/project52', 'project52'],
    ['/events', 'events'],
  ])('selects exactly one primary item for %s', (pathname, id) => {
    expect(getActivePublicNavigationItem(pathname)?.id).toBe(id);
  });

  it('does not let Home prefix-match the rest of the site', () => {
    const home = publicNavigationSections[0].items[0];
    expect(isNavigationItemActive(home, '/resources')).toBe(false);
  });

  it('does not treat Portal account destinations as public active items', () => {
    expect(getActivePublicNavigationItem('/portal')).toBeNull();
    expect(getActivePublicNavigationItem('/account/profile')).toBeNull();
  });
});
