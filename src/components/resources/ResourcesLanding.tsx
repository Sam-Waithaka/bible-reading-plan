import { ArrowRight, Rss, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ScriptureIcon } from '../../constants/siteIcons';
import type { ReactNode } from 'react';
import ResourcesCategoryTabs from './ResourcesCategoryTabs';
import ResourceCard from './ResourceCard';
import ResourceMasonry from './ResourceMasonry';
import ResourcesContainer from './ResourcesContainer';
import ResponsiveImage from '../media/ResponsiveImage';
import SiteButton from '../ui/SiteButton';
import { normalizeMediaAssetForDisplay } from '../../services/mediaAssetsApi';
import type {
  PublicCategoryRail,
  PublicResourceMinistry,
  PublicResourceSeries,
  PublicResourceTypeRail,
  PublicSeriesRail,
  PublicScriptureBook,
  PublicWritingCard,
  ResourcesHome,
  ResourcesNavigation,
} from '../../types/writing';

type ResourcesLandingProps = {
  darkMode: boolean;
  error?: string;
  home: ResourcesHome | null;
  loading: boolean;
  navigation: ResourcesNavigation | null;
};

type ImageBlockProps = {
  asset?: PublicWritingCard['og_image_detail'] | PublicResourceSeries['cover_image_detail'];
  className?: string;
  tone: string;
};

type BrowseItem = {
  count: number;
  href: string;
  icon: LucideIcon;
  label: string;
};

const fallbackTones = [
  'from-zinc-950 via-stone-800 to-amber-200',
  'from-stone-950 via-amber-900 to-stone-200',
  'from-zinc-950 via-[#4d3425] to-stone-300',
  'from-zinc-950 via-green-950 to-amber-100',
  'from-zinc-950 via-red-950 to-stone-200',
];

const sectionLabelClass = 'text-xs font-black uppercase tracking-[0.18em] text-red-800 dark:text-red-200';
const heroLabelClass = 'text-sm font-black uppercase tracking-[0.16em] text-red-700';
const centeredSectionHeaderClass = 'shrink-0 text-center text-sm font-black uppercase tracking-[0.16em] text-zinc-950 dark:text-stone-100';

const countLabel = (count?: number) => `${count ?? 0} ${(count ?? 0) === 1 ? 'Article' : 'Articles'}`;
const toneFor = (seed: number | string) => fallbackTones[Math.abs(String(seed).split('').reduce((total, char) => total + char.charCodeAt(0), 0)) % fallbackTones.length];
const ImageBlock = ({ asset, className = '', tone }: ImageBlockProps) => {
  const responsiveAsset = normalizeMediaAssetForDisplay(asset);

  return (
    <div className={`relative box-border w-full max-w-full min-w-0 overflow-hidden bg-gradient-to-br ${tone} ${className}`}>
      {responsiveAsset ? <ResponsiveImage alt="" asset={responsiveAsset} className="absolute inset-0 size-full object-cover" preset="card" /> : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.46),transparent_20%),linear-gradient(180deg,transparent,rgba(0,0,0,0.52))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(150deg,transparent_18%,rgba(255,255,255,0.18)_19%,transparent_20%,transparent_32%,rgba(255,255,255,0.12)_33%,transparent_34%)]" />
      <div className="absolute bottom-8 left-1/2 h-16 w-px -translate-x-1/2 bg-white/45" />
      <div className="absolute bottom-8 left-1/2 size-3 -translate-x-1/2 rounded-full border border-white/70" />
      <div className="absolute bottom-0 left-1/2 h-28 w-32 -translate-x-1/2 rounded-t-full bg-black/25 blur-xl" />
    </div>
  );
};

const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl border border-black/10 bg-white/70 shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:bg-[#171717] ${className}`} />
);

const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className="rounded-2xl border border-black/10 bg-white/70 p-6 text-sm font-semibold text-zinc-600 shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:bg-[#171717] dark:text-stone-400">
    {children}
  </div>
);

const FeaturedArticleCard = ({ article, eyebrow = 'Latest Publication', loading }: { article?: PublicWritingCard | null; eyebrow?: string; loading: boolean }) => {
  if (loading) return <SkeletonBlock className="min-h-[28rem] rounded-3xl" />;
  if (!article) {
    return (
      <div className="grid min-h-72 place-items-center rounded-3xl border border-black/10 bg-white/70 p-8 text-center shadow-2xl shadow-zinc-900/10 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 lg:min-h-[23rem]">
        <div>
          <p className={sectionLabelClass}>{eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-bold">No latest publication yet.</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-stone-400">Published writings will appear here once they are available.</p>
        </div>
      </div>
    );
  }

  return <ResourceCard article={article} eyebrow={eyebrow} presentation="hero" variant="feature" />;
};

const BrowseListCard = ({ emptyText, id, items, title }: { emptyText: string; id?: string; items: BrowseItem[]; title: string }) => (
  <section id={id} className="box-border w-full max-w-full min-w-0 scroll-mt-28">
    <div className="mb-4 flex box-border w-full max-w-full min-w-0 items-center justify-between gap-4">
      <h2 className={sectionLabelClass}>{title}</h2>
      <a
        href="#resources-latest"
        className="inline-flex min-w-0 shrink-0 items-center gap-1 text-sm font-bold text-zinc-700 transition hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-700 dark:text-stone-300 dark:hover:text-red-100"
      >
        View all
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    </div>
    {items.length ? (
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <a
              href={item.href}
              key={`${item.href}-${item.label}`}
              className="flex min-h-12 box-border w-full max-w-full min-w-0 items-center gap-3 border-b border-black/10 px-4 text-sm transition last:border-b-0 hover:bg-[#fffaf0] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-700 dark:border-white/10 dark:hover:bg-[#171717]"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-red-950/5 text-red-800 dark:bg-red-950/35 dark:text-red-100">
                <Icon size={14} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate font-bold text-zinc-800 dark:text-stone-200">{item.label}</span>
              <span className="shrink-0 text-xs font-semibold text-zinc-500 dark:text-stone-400">{countLabel(item.count)}</span>
              <ArrowRight size={15} className="shrink-0 text-zinc-500 dark:text-stone-400" aria-hidden="true" />
            </a>
          );
        })}
      </div>
    ) : <EmptyState>{emptyText}</EmptyState>}
  </section>
);

const CenteredSectionHeader = ({ id, title }: { id?: string; title: string }) => (
  <div className="mb-5 flex box-border w-full max-w-full min-w-0 items-center gap-4">
    <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
    <h2 id={id} className={centeredSectionHeaderClass + ' min-w-0 break-words [overflow-wrap:anywhere]'}>{title}</h2>
    <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
  </div>
);


const FeaturedWritingCard = ({ article }: { article: PublicWritingCard }) => (
  <ResourceCard article={article} className="mb-5 break-inside-avoid" eyebrow="Featured Article" />
);

const FeaturedCategoryCard = ({ category }: { category: ResourcesHome['featured_categories'][number] }) => (
  <a href={`/resources/category/${category.slug}`} className="group mb-5 flex min-h-72 box-border w-full max-w-full min-w-0 break-inside-avoid flex-col justify-between rounded-[1.75rem] border border-[#eaded0] bg-[#fffaf0] p-6 shadow-xl shadow-zinc-900/5 transition hover:-translate-y-1 hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:bg-[#171717] dark:shadow-black/40 dark:hover:bg-[#171717]">
    <span>
      <span className="inline-flex rounded-full border border-red-900/10 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-800 dark:border-red-200/10 dark:bg-red-950/30 dark:text-red-100">Featured Collection</span>
      <span className="mt-8 block font-serif text-3xl font-semibold leading-tight tracking-normal text-zinc-950 dark:text-stone-100">{category.name}</span>
      <span className="mt-5 block h-px w-14 bg-red-700/70" aria-hidden="true" />
      <span className="mt-5 line-clamp-4 block text-sm leading-6 text-zinc-600 dark:text-stone-400">{category.description || 'Browse writings gathered around this collection.'}</span>
    </span>
    <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-red-800 transition group-hover:translate-x-1 dark:text-red-100">
      Open collection
      <ArrowRight size={14} aria-hidden="true" />
    </span>
  </a>
);

const FeaturedSeriesCard = ({ series }: { series: PublicResourceSeries }) => (
  <a href={`/resources/series/${series.slug}`} className="group mb-5 grid min-h-72 box-border w-full max-w-full min-w-0 break-inside-avoid overflow-hidden rounded-[1.75rem] border border-black/10 bg-white shadow-xl shadow-zinc-900/5 transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 sm:grid-cols-[10rem_1fr]">
    <ImageBlock asset={series.cover_image_detail} tone={toneFor(series.slug || series.id)} className="min-h-72" />
    <span className="flex min-w-0 flex-col justify-between p-6">
      <span>
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-red-800 dark:text-red-200">Featured Series</span>
        <span className="mt-5 block font-serif text-2xl font-semibold leading-tight tracking-normal text-zinc-950 dark:text-stone-100">{series.title}</span>
        <span className="mt-4 line-clamp-3 block text-sm leading-6 text-zinc-600 dark:text-stone-400">{series.description || 'Follow this curated journey through the church library.'}</span>
      </span>
      <span className="mt-6 flex items-center justify-between gap-3 border-t border-black/10 pt-4 text-sm font-black text-zinc-600 dark:border-white/10 dark:text-stone-400">
        {countLabel(series.writing_count)}
        <ArrowRight size={15} className="text-red-800 transition group-hover:translate-x-1 dark:text-red-100" aria-hidden="true" />
      </span>
    </span>
  </a>
);

const FeaturedShowcase = ({ articles, categories, series, loading }: { articles: PublicWritingCard[]; categories: ResourcesHome['featured_categories']; series: PublicResourceSeries[]; loading: boolean }) => {
  const featuredCount = articles.length + categories.length + series.length;

  if (loading) {
    return (
      <div className="box-border w-full max-w-full min-w-0 rounded-[2rem] border border-[#eaded0] bg-[#fffaf0]/80 p-5 shadow-xl shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 sm:p-6">
        <div className="grid min-w-0 gap-5 lg:grid-cols-3">{[0, 1, 2].map((item) => <SkeletonBlock key={item} className="h-72" />)}</div>
      </div>
    );
  }

  if (!featuredCount) return null;

  return (
    <div className="box-border w-full max-w-full min-w-0 rounded-[2rem] border border-[#eaded0] bg-[#fffaf0]/80 p-5 shadow-xl shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 sm:p-6" data-resources-featured-shelf="true">
      <div className="mb-5 grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <p className={sectionLabelClass}>Curated Shelf</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-stone-400">
            Editor-selected articles, collections, and series gathered for prominent discovery.
          </p>
        </div>
        <p className="rounded-full border border-[#eaded0] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-600 dark:border-white/10 dark:bg-[#171717] dark:text-stone-400">
          {featuredCount} featured
        </p>
      </div>
      <div className="box-border w-full max-w-full min-w-0 columns-2 gap-3 sm:gap-5 md:columns-2 xl:columns-3" data-resources-masonry-shelf="featured">
        {articles.map((article) => <FeaturedWritingCard article={article} key={`article-${article.id}`} />)}
        {categories.map((category) => <FeaturedCategoryCard category={category} key={`category-${category.id}`} />)}
        {series.map((item) => <FeaturedSeriesCard series={item} key={`series-${item.id}`} />)}
      </div>
    </div>
  );
};

const ArticleGrid = ({ articles, emptyText, loading }: { articles: PublicWritingCard[]; emptyText: string; loading: boolean }) => {
  if (loading) {
    return <div className="grid box-border w-full max-w-full min-w-0 grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{[0, 1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-56 sm:h-72" />)}</div>;
  }
  if (!articles.length) return <EmptyState>{emptyText}</EmptyState>;
  return <ResourceMasonry articles={articles} shelf="latest" />;
};
const ArticleShelf = ({ articles, emptyText }: { articles: PublicWritingCard[]; emptyText: string }) => {
  if (!articles.length) return <EmptyState>{emptyText}</EmptyState>;

  return <ResourceMasonry articles={articles} limit={3} shelf="taxonomy" />;
};


const ResourceTypePreviewRail = ({ rail }: { rail: PublicResourceTypeRail }) => {
  const resourceType = rail.resource_type;
  const count = rail.count ?? resourceType.writing_count ?? rail.items.length;

  return (
    <article className="box-border w-full max-w-full min-w-0 rounded-[2rem] border border-[#eaded0] bg-[#fffaf0]/80 p-5 shadow-xl shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 sm:p-6" data-resources-taxonomy-shelf="resource-type">
      <div className="mb-5 grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <p className={sectionLabelClass + ' min-w-0 break-words [overflow-wrap:anywhere]'}>{resourceType.name}</p>
          <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-stone-400">
            {countLabel(count)} available
          </p>
        </div>
        <a
          href={`/resources/type/${resourceType.slug}`}
          className="inline-flex min-h-11 box-border w-full max-w-full min-w-0 items-center justify-center sm:w-auto gap-2 rounded-full border border-[#eaded0] bg-white px-4 py-2 text-sm font-black text-red-800 shadow-sm shadow-zinc-900/5 transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:bg-[#171717] dark:text-red-100 dark:hover:bg-[#171717] sm:justify-self-end"
        >
          <span className="sm:hidden">View all</span>
          <span className="hidden min-w-0 max-w-[28rem] break-words text-left sm:inline">View more {resourceType.name}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>
      <ArticleShelf articles={rail.items ?? []} emptyText={`Published ${resourceType.name.toLowerCase()} resources will appear here soon.`} />
    </article>
  );
};

const CategoryPreviewRail = ({ rail }: { rail: PublicCategoryRail }) => {
  const category = rail.category;
  const count = rail.count ?? category.writing_count ?? rail.items.length;

  return (
    <article className="box-border w-full max-w-full min-w-0 rounded-[2rem] border border-[#eaded0] bg-[#fffaf0]/80 p-5 shadow-xl shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 sm:p-6" data-resources-taxonomy-shelf="category">
      <div className="mb-5 grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <p className={sectionLabelClass + ' min-w-0 break-words [overflow-wrap:anywhere]'}>{category.name}</p>
          <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-stone-400">
            {countLabel(count)} available
          </p>
        </div>
        <a
          href={`/resources/category/${category.slug}`}
          className="inline-flex min-h-11 box-border w-full max-w-full min-w-0 items-center justify-center sm:w-auto gap-2 rounded-full border border-[#eaded0] bg-white px-4 py-2 text-sm font-black text-red-800 shadow-sm shadow-zinc-900/5 transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:bg-[#171717] dark:text-red-100 dark:hover:bg-[#171717] sm:justify-self-end"
        >
          <span className="sm:hidden">View all</span>
          <span className="hidden min-w-0 max-w-[28rem] break-words text-left sm:inline">View more {category.name}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>
      <ArticleShelf articles={rail.items ?? []} emptyText={`Published ${category.name.toLowerCase()} resources will appear here soon.`} />
    </article>
  );
};

const SeriesPreviewRail = ({ rail }: { rail: PublicSeriesRail }) => {
  const series = rail.series;
  const count = rail.count ?? series.writing_count ?? rail.items.length;

  return (
    <article className="box-border w-full max-w-full min-w-0 rounded-[2rem] border border-[#eaded0] bg-[#fffaf0]/80 p-5 shadow-xl shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 sm:p-6" data-resources-taxonomy-shelf="series">
      <div className="mb-5 grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <p className={sectionLabelClass + ' min-w-0 break-words [overflow-wrap:anywhere]'}>{series.title}</p>
          <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-stone-400">
            {countLabel(count)} available
          </p>
        </div>
        <a
          href={`/resources/series/${series.slug}`}
          className="inline-flex min-h-11 box-border w-full max-w-full min-w-0 items-center justify-center sm:w-auto gap-2 rounded-full border border-[#eaded0] bg-white px-4 py-2 text-sm font-black text-red-800 shadow-sm shadow-zinc-900/5 transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:bg-[#171717] dark:text-red-100 dark:hover:bg-[#171717] sm:justify-self-end"
        >
          <span className="sm:hidden">View all</span>
          <span className="hidden min-w-0 max-w-[28rem] break-words text-left sm:inline">View more {series.title}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>
      <ArticleShelf articles={rail.items ?? []} emptyText={`Published writings from ${series.title} will appear here soon.`} />
    </article>
  );
};
const ResourcesSubscribeStrip = ({ darkMode }: { darkMode: boolean }) => (
  <section className="box-border w-full max-w-full min-w-0 rounded-2xl border border-black/10 bg-[#fffaf0] p-5 shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40">
    <div className="flex box-border w-full max-w-full min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-red-950/5 text-red-800 dark:bg-red-950/35 dark:text-red-100">
          <Rss size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-black text-zinc-950 dark:text-stone-100">Stay updated with our latest resources.</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-stone-400">
            Subscribe to our RSS feed and never miss a new article.
          </p>
        </div>
      </div>
      <SiteButton
        className="w-full sm:w-auto"
        darkMode={darkMode}
        href="/resources/rss.xml"
        icon={ArrowRight}
        iconPosition="after"
        variant="tertiary"
      >
        Subscribe via RSS
      </SiteButton>
    </div>
  </section>
);

const ResourcesLanding = ({ darkMode, error = '', home, loading, navigation }: ResourcesLandingProps) => {
  const resourceTypes = navigation?.resource_types.length ? navigation.resource_types : home?.resource_types ?? [];
  const featuredArticles = home?.featured_articles ?? [];
  const featuredCategories = home?.featured_categories ?? [];
  const featuredSeries = home?.featured_series ?? [];
  const latestArticles = home?.latest_articles ?? [];
  const resourceTypeRails = home?.resource_type_rails ?? [];
  const categoryRails = home?.category_rails ?? [];
  const seriesRails = home?.series_rails ?? [];
  const latestPublication = home?.hero_featured || latestArticles[0] || null;
  const scriptureBooks = home?.scripture_books.length ? home.scripture_books : navigation?.scripture_books ?? [];
  const ministries = home?.ministries.length ? home.ministries : navigation?.ministries ?? [];
  const scriptureItems = scriptureBooks.map((book: PublicScriptureBook) => ({
    count: book.writing_count,
    href: `/resources/book/${encodeURIComponent(book.osis_id)}`,
    icon: ScriptureIcon,
    label: book.name,
  }));
  const ministryItems = ministries.map((ministry: PublicResourceMinistry) => ({
    count: ministry.writing_count,
    href: `/resources/ministry/${encodeURIComponent(ministry.slug)}`,
    icon: UsersRound,
    label: ministry.name,
  }));

  return (
    <main
      className={`box-border w-full max-w-full min-w-0 flex-1 ${
        darkMode
          ? 'bg-[#080808] text-stone-100'
          : 'bg-[linear-gradient(180deg,#f8f5ef,#fffaf0_42%,#f8f5ef)] text-zinc-950'
      }`}
    >
      <section className="box-border w-full max-w-full min-w-0 border-b border-black/10 py-12 dark:border-white/10 sm:py-16 xl:py-20">
        <ResourcesContainer>
          <div className="grid box-border w-full max-w-full min-w-0 gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(25rem,0.82fr)] xl:items-center xl:gap-12" data-resources-hero-layout="two-column-tablet">
          <div className="w-full max-w-3xl min-w-0">
            <p className={heroLabelClass}>THE LIBRARY</p>
            <p className="mt-7 min-w-0 max-w-full break-words font-serif text-[clamp(2.75rem,7vw,4.75rem)] font-bold leading-[0.98] tracking-normal text-zinc-950 dark:text-stone-100 sm:mt-8">
              <span className="block min-w-0 break-words">Study deeply.</span>
              <span className="block min-w-0 break-words">Reflect faithfully.</span>
              <span className="block min-w-0 break-words text-red-700">Live differently.</span>
            </p>
            <p className="mt-7 min-w-0 max-w-[34rem] break-words text-base leading-7 text-zinc-700 dark:text-stone-300 sm:mt-8 sm:text-lg sm:leading-8">
              Articles, Bible studies, pastoral guidance, and devotional reflections.
            </p>
            <div className="mt-8 h-px w-16 bg-red-700" aria-hidden="true" />
            <div className="mt-8">
              <a
                href="#resources-latest"
                className="inline-flex items-center gap-2 text-sm font-black text-red-800 transition hover:translate-x-1 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-700 dark:text-red-100 dark:hover:text-red-200"
              >
                Explore the library
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="box-border w-full max-w-full min-w-0 xl:justify-self-end xl:[&_a[data-resource-card-mode='editorial-cover-only']]:max-w-full" data-resources-hero-article="true">
            <FeaturedArticleCard article={latestPublication} eyebrow="Latest Publication" loading={loading} />
          </div>
          </div>
        </ResourcesContainer>
      </section>

      <ResourcesCategoryTabs darkMode={darkMode} resourceTypes={resourceTypes} />

      <ResourcesContainer className="grid box-border w-full max-w-full min-w-0 gap-8 py-8 pb-32 sm:gap-10 sm:py-10 sm:pb-32 xl:pb-12">
        {error ? (
          <div className="rounded-2xl border border-red-900/15 bg-red-50 p-5 text-sm font-bold text-red-800 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-100">
            {error}
          </div>
        ) : null}


        {(loading || featuredArticles.length || featuredCategories.length || featuredSeries.length) ? <section id="resources-featured" className="box-border w-full max-w-full min-w-0 scroll-mt-28" aria-labelledby="resources-featured-heading">
          <CenteredSectionHeader id="resources-featured-heading" title="Featured" />
          <FeaturedShowcase articles={featuredArticles} categories={featuredCategories} series={featuredSeries} loading={loading} />
        </section> : null}

        <section className="box-border w-full max-w-full min-w-0" aria-labelledby="resources-latest">
          <CenteredSectionHeader id="resources-latest" title="Latest" />
          <ArticleGrid articles={latestArticles} emptyText="Latest published writings will appear here soon." loading={loading} />
        </section>

        <section id="resources-resource-type-rails" className="box-border w-full max-w-full min-w-0 scroll-mt-28" aria-labelledby="resources-resource-type-rails-heading">
          <CenteredSectionHeader id="resources-resource-type-rails-heading" title="Explore by Resource Type" />
          {loading ? (
            <div className="grid box-border w-full max-w-full min-w-0 gap-6">
              {[0, 1, 2].map((item) => <SkeletonBlock key={item} className="h-56 rounded-[2rem]" />)}
            </div>
          ) : resourceTypeRails.length ? (
            <div className="grid box-border w-full max-w-full min-w-0 gap-6">
              {resourceTypeRails.map((rail) => <ResourceTypePreviewRail key={rail.resource_type.id} rail={rail} />)}
            </div>
          ) : null}
        </section>

        <section id="resources-category-rails" className="box-border w-full max-w-full min-w-0 scroll-mt-28" aria-labelledby="resources-category-rails-heading">
          <CenteredSectionHeader id="resources-category-rails-heading" title="Explore by Category" />
          {loading ? (
            <div className="grid box-border w-full max-w-full min-w-0 gap-6">
              {[0, 1, 2].map((item) => <SkeletonBlock key={item} className="h-56 rounded-[2rem]" />)}
            </div>
          ) : categoryRails.length ? (
            <div className="grid box-border w-full max-w-full min-w-0 gap-6">
              {categoryRails.map((rail) => <CategoryPreviewRail key={rail.category.id} rail={rail} />)}
            </div>
          ) : null}
        </section>

        <section id="resources-series-rails" className="box-border w-full max-w-full min-w-0 scroll-mt-28" aria-labelledby="resources-series-rails-heading">
          <CenteredSectionHeader id="resources-series-rails-heading" title="Explore by Series" />
          {loading ? (
            <div className="grid box-border w-full max-w-full min-w-0 gap-6">
              {[0, 1, 2].map((item) => <SkeletonBlock key={item} className="h-56 rounded-[2rem]" />)}
            </div>
          ) : seriesRails.length ? (
            <div className="grid box-border w-full max-w-full min-w-0 gap-6">
              {seriesRails.map((rail) => <SeriesPreviewRail key={rail.series.id} rail={rail} />)}
            </div>
          ) : null}
        </section>

        {(loading || scriptureItems.length || ministryItems.length) ? (
          <section className="grid box-border w-full max-w-full min-w-0 gap-8 md:grid-cols-2">
            {loading ? <SkeletonBlock className="h-80" /> : scriptureItems.length ? <BrowseListCard emptyText="" id="resources-scripture" title="Browse Scripture" items={scriptureItems} /> : null}
            {loading ? <SkeletonBlock className="h-80" /> : ministryItems.length ? <BrowseListCard emptyText="" id="resources-ministry" title="Browse Ministry" items={ministryItems} /> : null}
          </section>
        ) : null}

        <ResourcesSubscribeStrip darkMode={darkMode} />
      </ResourcesContainer>
    </main>
  );
};

export default ResourcesLanding;



