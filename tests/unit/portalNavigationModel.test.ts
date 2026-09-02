import { describe, expect, it } from 'vitest';

import {
  getActivePortalNavigationItem,
  getVisiblePortalNavigationSections,
} from '../../src/components/navigation/portalNavigationModel';
import { WRITING_PERMISSIONS } from '../../src/utils/permissions';

const capabilities = (hasPortalAccess: boolean, permissions: string[] = []) => ({
  hasPortalAccess,
  permissions,
});

describe('portalNavigationModel', () => {
  it('omits empty sections when Portal access is unavailable', () => {
    expect(getVisiblePortalNavigationSections(capabilities(false))).toEqual([]);
  });

  it('shows Dashboard for Portal members and filters Writing Studio by capability', () => {
    const memberItems = getVisiblePortalNavigationSections(capabilities(true))
      .flatMap((section) => section.items);
    expect(memberItems.map((item) => item.label)).toEqual(['Dashboard']);

    const editorItems = getVisiblePortalNavigationSections(
      capabilities(true, [WRITING_PERMISSIONS.createWriting]),
    ).flatMap((section) => section.items);
    expect(editorItems.map((item) => item.label)).toEqual(['Dashboard', 'Writing Studio']);
  });

  it('uses exact Dashboard and prefix Writing Studio matching', () => {
    const editor = capabilities(true, [WRITING_PERMISSIONS.createWriting]);
    expect(getActivePortalNavigationItem('/portal', editor)?.label).toBe('Dashboard');
    expect(getActivePortalNavigationItem('/portal/writing/articles', editor)?.label).toBe('Writing Studio');
    expect(getActivePortalNavigationItem('/account', editor)).toBeNull();
  });
});
