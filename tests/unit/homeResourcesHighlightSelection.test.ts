import { describe, expect, it } from 'vitest';

import type { PublicResourceSeries, PublicWritingCard } from '../../src/types/writing';
import { selectHomeResourcesHighlightContent } from '../../src/utils/homeResourcesHighlightSelection';

const writing = (id: number, title = `Writing ${id}`) => ({ id, slug: `writing-${id}`, title }) as PublicWritingCard;
const series = (cover = false) => ({
  cover_image_detail: cover ? { id: 20, url: '/series-cover.jpg' } : null,
  description: 'An ordered journey through Scripture.',
  id: 10,
  slug: 'proverbs-wisdom',
  title: 'Proverbs: Practical Wisdom',
  writing_count: 6,
}) as PublicResourceSeries;

describe('selectHomeResourcesHighlightContent', () => {
  it('hides the highlight when there are no eligible writings', () => {
    expect(selectHomeResourcesHighlightContent({ featured_articles: [], featured_series: [series()], latest_articles: [] })).toBeNull();
  });

  it('resolves a single writing as a true single-item state', () => {
    expect(selectHomeResourcesHighlightContent({ featured_articles: [], featured_series: [], latest_articles: [writing(1)] })).toMatchObject({
      layout: 'single',
      latestPublication: { id: 1 },
      series: null,
      writings: [{ id: 1 }],
    });
  });

  it('treats a featured Series as a first-class shelf item', () => {
    expect(selectHomeResourcesHighlightContent({ featured_articles: [writing(1)], featured_series: [series(true)], latest_articles: [] })).toMatchObject({
      layout: 'pair',
      series: { id: 10, cover_image_detail: { id: 20 } },
      writings: [{ id: 1 }],
    });
  });

  it('reserves one shelf slot for Series before filling from latest writings', () => {
    const result = selectHomeResourcesHighlightContent({
      featured_articles: [writing(1)],
      featured_series: [series()],
      latest_articles: [writing(1), writing(2), writing(3), writing(4)],
    });

    expect(result).toMatchObject({ layout: 'shelf', series: { id: 10 } });
    expect(result?.writings.map(({ id }) => id)).toEqual([1, 2]);
  });

  it('assigns latest_articles[0] to the dominant anchor before featured support', () => {
    const result = selectHomeResourcesHighlightContent({
      featured_articles: [writing(1, 'Featured support')],
      featured_series: [series()],
      latest_articles: [writing(2, 'Newest publication'), writing(3, 'Older publication')],
    });

    expect(result?.latestPublication?.id).toBe(2);
    expect(result?.writings.map(({ id }) => id)).toEqual([2, 1]);
  });

  it('uses three deduplicated writings when no featured Series exists', () => {
    const result = selectHomeResourcesHighlightContent({
      featured_articles: [writing(1), writing(2)],
      featured_series: [],
      latest_articles: [writing(2), writing(3), writing(4)],
    });

    expect(result?.layout).toBe('shelf');
    expect(result?.writings.map(({ id }) => id)).toEqual([2, 1, 3]);
  });
});
