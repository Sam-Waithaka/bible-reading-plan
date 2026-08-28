// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentSettingsPanel from '../../src/components/portal/writing/DocumentSettingsPanel';
import { clearApiClientCaches } from '../../src/services/apiClient';

const jsonResponse = (payload: unknown) => new Response(JSON.stringify(payload), {
  headers: { 'Content-Type': 'application/json' },
  status: 200,
});

describe('DocumentSettingsPanel', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    clearApiClientCaches();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    clearApiClientCaches();
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it('loads taxonomy options and edits rich metadata for the selected resource type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      categories: [{ id: 2, name: 'Proverbs', slug: 'proverbs' }],
      ministries: [{ id: 5, name: 'Youth Ministry', slug: 'youth' }],
      series: [{ id: 3, slug: 'proverbs-lessons', title: 'Proverbs Lessons' }],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const onCategoryIdsChange = vi.fn();
    const onSeriesIdsChange = vi.fn();
    const onMinistryIdsChange = vi.fn();
    const onTagIdsChange = vi.fn();
    const onAuthorAttributionsChange = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(
        <DocumentSettingsPanel
          actions={[]}
          authorAttributions={[]}
          canManageAuthors
          categoryIds={[]}
          darkMode={false}
          excerpt=""
          onAuthorAttributionsChange={onAuthorAttributionsChange}
          onCategoryIdsChange={onCategoryIdsChange}
          onExcerptChange={() => undefined}
          onMinistryIdsChange={onMinistryIdsChange}
          onResourceTypeChange={() => undefined}
          onSeriesIdsChange={onSeriesIdsChange}
          onTagIdsChange={onTagIdsChange}
          resourceType="1"
          resourceTypes={[{ id: 1, name: 'Bible Study', slug: 'bible-study' }]}
          status="DRAFT"
          tagOptions={[{ id: 8, name: 'Prayer', slug: 'prayer' }]}
        />,
      );
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith('/v1/resources/navigation/?resource_type_slug=bible-study', expect.anything());
    const articleDetailsToggle = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Article details')) as HTMLButtonElement;
    await act(async () => articleDetailsToggle.click());
    expect(container.textContent).toContain('Proverbs');
    expect(container.textContent).toContain('Proverbs Lessons');
    expect(container.textContent).toContain('Youth Ministry');
    expect(container.textContent).toContain('Prayer');

    const detailsCheckboxes = container.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    await act(async () => detailsCheckboxes[0].click());
    await act(async () => detailsCheckboxes[1].click());
    await act(async () => detailsCheckboxes[2].click());
    await act(async () => detailsCheckboxes[3].click());
    expect(onCategoryIdsChange).toHaveBeenCalledWith([2]);
    expect(onSeriesIdsChange).toHaveBeenCalledWith([3]);
    expect(onMinistryIdsChange).toHaveBeenCalledWith([5]);
    expect(onTagIdsChange).toHaveBeenCalledWith([8]);

    const addAuthor = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Add')) as HTMLButtonElement;
    await act(async () => addAuthor.click());
    expect(onAuthorAttributionsChange).toHaveBeenCalledWith([{ display_name: '', role: 'AUTHOR', is_primary: true, order: 0 }]);

    const presentationToggle = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Public presentation')) as HTMLButtonElement;
    await act(async () => presentationToggle.click());
    expect(container.textContent).toContain('0 / 200');
  });

  it('renders selected series order controls and moves ordered series ids', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      categories: [],
      ministries: [],
      series: [
        { id: 3, slug: 'first', title: 'First Series' },
        { id: 4, slug: 'second', title: 'Second Series' },
      ],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const onSeriesIdsChange = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(
        <DocumentSettingsPanel
          actions={[]}
          categoryIds={[]}
          darkMode={false}
          excerpt=""
          onCategoryIdsChange={() => undefined}
          onExcerptChange={() => undefined}
          onResourceTypeChange={() => undefined}
          onSeriesIdsChange={onSeriesIdsChange}
          resourceType="1"
          resourceTypes={[{ id: 1, name: 'Bible Study', slug: 'bible-study' }]}
          seriesIds={[3, 4]}
          status="DRAFT"
        />,
      );
      await Promise.resolve();
    });

    const articleDetailsToggle = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Article details')) as HTMLButtonElement;
    await act(async () => articleDetailsToggle.click());

    expect(container.textContent).toContain('Series order');
    expect(container.textContent).toContain('1. First Series');
    expect(container.textContent).toContain('2. Second Series');

    const moveSecondUp = [...container.querySelectorAll('button')].filter((button) => button.textContent === 'Up')[1] as HTMLButtonElement;
    await act(async () => moveSecondUp.click());
    expect(onSeriesIdsChange).toHaveBeenCalledWith([4, 3]);
  });

  it('can split document settings into desktop left and right section groups', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      categories: [{ id: 2, name: 'Prayer', slug: 'prayer' }],
      ministries: [],
      series: [{ id: 3, slug: 'project-52', title: 'Project 52' }],
    })));

    await act(async () => {
      root = createRoot(container);
      root.render(
        <div>
          <DocumentSettingsPanel
            actions={[{ label: 'Save draft', onClick: () => undefined, variant: 'secondary' }]}
            categoryIds={[]}
            darkMode={false}
            excerpt=""
            onCategoryIdsChange={() => undefined}
            onExcerptChange={() => undefined}
            onResourceTypeChange={() => undefined}
            resourceType="1"
            resourceTypes={[{ id: 1, name: 'Devotional', slug: 'devotional' }]}
            sectionGroup="left"
            status="DRAFT"
          />
          <DocumentSettingsPanel
            actions={[{ label: 'Save draft', onClick: () => undefined, variant: 'secondary' }]}
            categoryIds={[]}
            darkMode={false}
            excerpt=""
            metadata={[{ label: 'Reading time', value: '4 minutes' }]}
            onCategoryIdsChange={() => undefined}
            onExcerptChange={() => undefined}
            onResourceTypeChange={() => undefined}
            resourceType="1"
            resourceTypes={[{ id: 1, name: 'Devotional', slug: 'devotional' }]}
            sectionGroup="right"
            status="DRAFT"
            workflowControl={<p>Workflow controls</p>}
          />
        </div>,
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Article basics');
    expect(container.textContent).toContain('Public presentation');
    expect(container.textContent).toContain('Editorial workflow');
    expect(container.textContent).toContain('Article details');
    expect(container.textContent).not.toContain('Actions');
    expect(container.textContent).not.toContain('Save draft');
  });

});
