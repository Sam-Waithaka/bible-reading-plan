import { BookOpen, ScrollText } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  AccountIcon,
  MediaIcon,
  Project52Icon,
  ResourcesIcon,
  ScriptureIcon,
  siteIcons,
} from '../../src/constants/siteIcons';

describe('siteIcons', () => {
  it('keeps shared semantic icon exports and the data-driven registry aligned', () => {
    expect(siteIcons.account).toBe(AccountIcon);
    expect(siteIcons.media).toBe(MediaIcon);
    expect(siteIcons.project52).toBe(Project52Icon);
    expect(siteIcons.resources).toBe(ResourcesIcon);
    expect(siteIcons.scripture).toBe(ScriptureIcon);
    expect(ScriptureIcon).toBe(ScrollText);
    expect(Project52Icon).toBe(BookOpen);
  });
});