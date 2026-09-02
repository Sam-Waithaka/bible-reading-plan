// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResourcesDetailPage from "../../src/pages/ResourcesDetailPage";

const mocks = vi.hoisted(() => ({
  fetchPublicResourceDetail: vi.fn(),
}));

vi.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({ darkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../src/components/navigation/SiteHeader", () => ({
  default: () => <header>Site Header</header>,
}));

vi.mock("../../src/components/navigation/SiteFooter", () => ({
  default: () => <footer>Site Footer</footer>,
}));

vi.mock("../../src/services/resourcesApi", () => ({
  fetchPublicResourceDetail: mocks.fetchPublicResourceDetail,
}));

const detail = (overrides: Record<string, unknown> = {}) => ({
  author_attributions: [
    { display_name: "Pastor Jane", id: 1, is_primary: true, order: 0, role: "AUTHOR" },
  ],
  author_display: "Pastor Jane",
  byline: "Pastor Jane",
  canonical_lookup: {
    published_at: "2026-07-17T09:00:00Z",
    slug: "grace-for-today",
  },
  canonical_url: "/resources/grace-for-today",
  categories: [],
  content_html: "<p>Flat cached HTML</p>",
  content_json: {
    root: {
      children: [
        {
          children: [
            {
              text: "Grace teaches us to walk faithfully.",
              type: "text",
              version: 1,
            },
          ],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  },
  content_text: "Grace teaches us to walk faithfully.",
  content_version: 1,
  excerpt: "A public article excerpt.",
  id: 10,
  media_embeds: [],
  ministries: [],
  continue_reading: {
    more_from_categories: [],
    more_from_series: [],
    more_resources: [],
    study_same_scriptures: [],
  },
  next_article: null,
  og_description: "OG description.",
  og_image_detail: null,
  og_title: "OG title",
  previous_article: null,
  published_at: "2026-07-17T09:00:00Z",
  reading_time_minutes: 6,
  resource_type_detail: { id: 1, name: "Devotional", slug: "devotional" },
  scripture_references: [],
  seo_description: "SEO description.",
  seo_title: "SEO title",
  series: [],
  slug: "grace-for-today",
  slug_variants: [],
  tags: [],
  title: "Grace for Today",
  writing_type: "ARTICLE",
  ...overrides,
});



const card = (slug: string, title: string, overrides: Record<string, unknown> = {}) => ({
  author_attributions: [],
  author_display: "A.I.C Njoro Town",
  byline: "A.I.C Njoro Town",
  categories: [],
  excerpt: `Excerpt for ${title}`,
  id: slug,
  ministries: [],
  og_image_detail: null,
  published_at: "2026-07-18T09:00:00Z",
  reading_time_minutes: 4,
  resource_type_detail: { id: 1, name: "Devotional", slug: "devotional" },
  scripture_references: [],
  seo_description: `SEO for ${title}`,
  seo_title: title,
  series: [],
  slug,
  tags: [],
  title,
  writing_type: "ARTICLE",
  ...overrides,
});

const renderDetail = async (
  root: Root,
  path = "/resources/grace-for-today",
) => {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/resources/:slug" element={<ResourcesDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await Promise.resolve();
  });
};

describe("ResourcesDetailPage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mocks.fetchPublicResourceDetail.mockReset();
    mocks.fetchPublicResourceDetail.mockResolvedValue(detail());
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("loads a public resource by slug and renders it through the article reader", async () => {
    await renderDetail(root);

    await vi.waitFor(() => expect(container.textContent).toContain("Grace for Today"));
    expect(mocks.fetchPublicResourceDetail).toHaveBeenCalledWith(
      "grace-for-today",
      undefined,
      expect.any(AbortSignal),
    );
    expect(container.querySelector('[aria-label="Published writing"]')).not.toBeNull();
    expect(container.querySelector(".editor-paper-surface-light")).not.toBeNull();
    expect(container.textContent).toContain("A public article excerpt.");
    expect(container.textContent).toContain("Grace teaches us to walk faithfully.");
    expect(container.textContent).not.toContain("Flat cached HTML");
    expect(container.textContent).toContain("Pastor Jane");
    expect(container.textContent).toContain("6 min read");
  });

  it("passes published_at query parameter when present", async () => {
    await renderDetail(
      root,
      "/resources/grace-for-today?published_at=2026-07-17T09%3A00%3A00Z",
    );

    await vi.waitFor(() =>
      expect(mocks.fetchPublicResourceDetail).toHaveBeenCalledWith(
        "grace-for-today",
        "2026-07-17T09:00:00Z",
        expect.any(AbortSignal),
      ),
    );
  });



  it("renders taxonomy links and previous/next reader navigation from the public detail payload", async () => {
    mocks.fetchPublicResourceDetail.mockResolvedValueOnce(
      detail({
        categories: [
          {
            description: "",
            id: 2,
            is_active: true,
            is_featured: false,
            name: "Prayer",
            parent: null,
            slug: "prayer",
            sort_order: 1,
            writing_count: 3,
          },
        ],
        next_article: {
          id: 12,
          published_at: "2026-07-19T09:00:00Z",
          slug: "next-resource",
          title: "Next Resource",
        },
        previous_article: {
          id: 8,
          published_at: "2026-07-16T09:00:00Z",
          slug: "previous-resource",
          title: "Previous Resource",
        },
        scripture_references: [
          {
            book: "John",
            book_detail: {
              abbreviation: "Jn",
              id: 43,
              name: "John",
              number: 43,
              osis_id: "John",
              testament: "NT",
            },
            book_osis: "John",
            chapter_start: 3,
            display_text: "John 3:16",
            id: 99,
            verse_start: 16,
            version: "BSB",
            writing: 10,
          },
        ],
        series: [
          {
            cover_image_detail: null,
            description: "",
            id: 3,
            slug: "advent-readings",
            title: "Advent Readings",
            writing_count: 5,
          },
        ],
      }),
    );

    await renderDetail(root);

    await vi.waitFor(() => expect(container.textContent).toContain("About this Resource"));
    expect(container.querySelector('a[href="/resources/type/devotional"]')).not.toBeNull();
    expect(container.querySelector('a[href="/resources/category/prayer"]')).not.toBeNull();
    expect(container.querySelector('a[href="/resources/series/advent-readings"]')).not.toBeNull();
    expect(container.querySelector('a[href="/resources/book/John"]')).not.toBeNull();
    expect(container.querySelector('a[href="/resources/previous-resource"]')).not.toBeNull();
    expect(container.querySelector('a[href="/resources/next-resource"]')).not.toBeNull();
  });


  it("keeps referenced scriptures last, collapsed, and separate from resource metadata", async () => {
    mocks.fetchPublicResourceDetail.mockResolvedValueOnce(
      detail({
        categories: [
          {
            description: "",
            id: 2,
            is_active: true,
            is_featured: false,
            name: "Prayer",
            parent: null,
            slug: "prayer",
            sort_order: 1,
            writing_count: 3,
          },
        ],
        continue_reading: {
          more_from_categories: [],
          more_from_series: [],
          more_resources: [card("more-resource", "Another Resource")],
          study_same_scriptures: [],
        },
        scripture_references: [
          {
            book: "John",
            book_detail: {
              abbreviation: "Jn",
              id: 43,
              name: "John",
              number: 43,
              osis_id: "John",
              testament: "NT",
            },
            book_osis: "John",
            chapter_start: 3,
            display_text: "John 3:16",
            id: 99,
            verse_start: 16,
            version: "BSB",
            writing: 10,
          },
          {
            book: "Psalms",
            book_osis: "Ps",
            chapter_start: 119,
            display_text: "Psalms 119:9",
            id: 100,
            verse_start: 9,
            version: "BSB",
            writing: 10,
          },
          {
            book: "Genesis",
            book_osis: "Gen",
            chapter_start: 1,
            display_text: "GEN 1:1",
            id: 101,
            verse_start: 1,
            version: "BSB",
            writing: 10,
          },
          {
            book: "2 Timothy",
            book_osis: "2Tim",
            chapter_start: 3,
            display_text: "2 Timothy 3:16",
            id: 102,
            verse_start: 16,
            version: "BSB",
            writing: 10,
          },
        ],
        series: [
          {
            cover_image_detail: null,
            description: "",
            id: 3,
            slug: "advent-readings",
            title: "Advent Readings",
            writing_count: 5,
          },
        ],
      }),
    );

    await renderDetail(root);

    await vi.waitFor(() => expect(container.textContent).toContain("Referenced Scriptures"));

    const referencedScriptures = container.querySelector('[aria-labelledby="referenced-scriptures-title"]');
    const aboutResource = container.querySelector('[aria-labelledby="about-resource-title"]');
    expect(referencedScriptures).not.toBeNull();
    expect(aboutResource).not.toBeNull();
    expect(referencedScriptures?.querySelectorAll('a[href^="/resources/book/"]').length).toBe(3);
    expect(referencedScriptures?.textContent).toContain("John 3:16");
    expect(referencedScriptures?.textContent).not.toContain("2 Timothy 3:16");
    expect(aboutResource?.textContent).toContain("Resource Type");
    expect(aboutResource?.textContent).toContain("Category");
    expect(aboutResource?.textContent).toContain("Series");
    expect(aboutResource?.textContent).not.toContain("Scripture");
    expect(aboutResource?.textContent).not.toContain("John 3:16");

    const railOrder = Array.from(
      container.querySelectorAll(
        '[aria-labelledby="share-article-title"], [aria-labelledby="about-resource-title"], [aria-label="Continue reading recommendations"], [aria-labelledby="referenced-scriptures-title"]',
      ),
    ).map((element) => element.getAttribute('aria-labelledby') || element.getAttribute('aria-label'));
    expect(railOrder).toEqual([
      "share-article-title",
      "about-resource-title",
      "Continue reading recommendations",
      "referenced-scriptures-title",
    ]);

    const showMore = referencedScriptures?.querySelector('button');
    expect(showMore?.textContent).toContain("Show more");
    await act(async () => {
      showMore?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(referencedScriptures?.querySelectorAll('a[href^="/resources/book/"]').length).toBe(4);
    expect(referencedScriptures?.textContent).toContain("2 Timothy 3:16");
  });
  it("does not render previous/next controls without series context", async () => {
    mocks.fetchPublicResourceDetail.mockResolvedValueOnce(
      detail({
        next_article: {
          id: 12,
          published_at: "2026-07-19T09:00:00Z",
          slug: "next-resource",
          title: "Next Resource",
        },
        previous_article: {
          id: 8,
          published_at: "2026-07-16T09:00:00Z",
          slug: "previous-resource",
          title: "Previous Resource",
        },
        series: [],
      }),
    );

    await renderDetail(root);

    await vi.waitFor(() => expect(container.textContent).toContain("Grace for Today"));
    expect(container.textContent).not.toContain("Previous in Series");
    expect(container.textContent).not.toContain("Next in Series");
    expect(container.querySelector('a[href="/resources/previous-resource"]')).toBeNull();
    expect(container.querySelector('a[href="/resources/next-resource"]')).toBeNull();
  });

  it("renders backend-composed continue reading groups without extra search fan-out", async () => {
    mocks.fetchPublicResourceDetail.mockResolvedValueOnce(
      detail({
        continue_reading: {
          more_from_categories: [
            {
              category: {
                description: "",
                id: 2,
                is_active: true,
                is_featured: false,
                name: "Prayer",
                parent: null,
                slug: "prayer",
                sort_order: 1,
                writing_count: 3,
              },
              items: [card("more-prayer", "A Prayer Resource")],
            },
          ],
          more_from_series: [
            {
              series: {
                cover_image_detail: null,
                description: "",
                id: 3,
                slug: "advent-readings",
                title: "Advent Readings",
                writing_count: 5,
              },
              items: [card("series-resource", "A Series Resource")],
            },
          ],
          more_resources: [card("more-resource", "Another Resource")],
          study_same_scriptures: [
            {
              book: {
                abbreviation: "Jn",
                id: 43,
                name: "John",
                number: 43,
                osis_id: "John",
                testament: "NT",
                writing_count: 4,
              },
              items: [card("john-resource", "A John Resource")],
            },
          ],
        },
      }),
    );

    await renderDetail(root);

    await vi.waitFor(() => expect(container.textContent).toContain("More from this Series"));
    expect(container.textContent).toContain("More from Prayer");
    expect(container.textContent).toContain("Study the Same Scriptures");
    expect(container.textContent).toContain("More Resources");
    expect(container.textContent).toContain("A Series Resource");
    expect(container.textContent).toContain("A Prayer Resource");
    expect(container.textContent).toContain("A John Resource");
    expect(container.textContent).toContain("Another Resource");
    expect(mocks.fetchPublicResourceDetail).toHaveBeenCalledTimes(1);
  });

  it("shows a graceful error when the public detail cannot load", async () => {
    mocks.fetchPublicResourceDetail.mockRejectedValueOnce(new Error("Nope"));

    await renderDetail(root);

    await vi.waitFor(() =>
      expect(container.textContent).toContain("Unable to load this resource right now."),
    );
    expect(container.textContent).toContain("Back to Resources");
  });
});
