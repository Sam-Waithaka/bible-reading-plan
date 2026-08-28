import type { PublicResourceSeries, PublicWritingCard, ResourcesHome } from '../types/writing';

export type HomeResourcesHighlightContent = {
  layout: 'pair' | 'shelf' | 'single';
  latestPublication: PublicWritingCard | null;
  series: PublicResourceSeries | null;
  writings: PublicWritingCard[];
};

const writingKey = (writing: PublicWritingCard) => String(writing.id || writing.slug);

export const selectHomeResourcesHighlightContent = (
  home: Pick<ResourcesHome, 'featured_articles' | 'featured_series' | 'latest_articles'>,
): HomeResourcesHighlightContent | null => {
  const latestPublication = home.latest_articles[0] ?? null;
  const seen = new Set<string>();
  const eligibleWritings = [latestPublication, ...home.featured_articles, ...home.latest_articles].filter((writing): writing is PublicWritingCard => {
    if (!writing) return false;
    const key = writingKey(writing);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (eligibleWritings.length === 0) return null;

  const series = home.featured_series[0] ?? null;
  const writingLimit = series && eligibleWritings.length > 1 ? 2 : 3;

  const writings = eligibleWritings.slice(0, writingLimit);
  const itemCount = writings.length + (series ? 1 : 0);

  return {
    layout: itemCount === 1 ? 'single' : itemCount === 2 ? 'pair' : 'shelf',
    latestPublication,
    series,
    writings,
  };
};
