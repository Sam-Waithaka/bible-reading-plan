import { ArrowRight, Clock3, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import ResponsiveImage from '../media/ResponsiveImage';
import { normalizeMediaAssetForDisplay } from '../../services/mediaAssetsApi';
import type { PublicWritingCard } from '../../types/writing';
import { getEditorialCoverPresentation } from '../../utils/resourceEditorialPresentation';

export type ResourceCardVariant = 'compact' | 'feature' | 'masonry' | 'rail';

type ResourceCardProps = {
  article: PublicWritingCard;
  className?: string;
  eyebrow?: string;
  variant?: ResourceCardVariant;
  presentation?: 'default' | 'hero';
};

const writingHref = (article: PublicWritingCard) => `/resources/${article.slug}`;
const formatAuthorNames = (names: string[]) => {
  const uniqueNames = Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));

  if (uniqueNames.length === 0) return 'A.I.C Njoro Town';
  if (uniqueNames.length === 1) return uniqueNames[0];
  if (uniqueNames.length === 2) return `${uniqueNames[0]} & ${uniqueNames[1]}`;

  return `${uniqueNames.slice(0, -1).join(', ')} & ${uniqueNames[uniqueNames.length - 1]}`;
};

const articleAuthor = (article: PublicWritingCard) => {
  const attributionNames = [...(article.author_attributions ?? [])]
    .sort((first, second) => (first.order ?? 0) - (second.order ?? 0))
    .map((attribution) => attribution.display_name)
    .filter((name): name is string => Boolean(name?.trim()));

  if (attributionNames.length) return formatAuthorNames(attributionNames);
  return article.byline || article.author_display || 'A.I.C Njoro Town';
};
const articleAccent = (article: PublicWritingCard) => article.resource_type_detail?.name || article.writing_type || 'Resource';

const MetaItem = ({ children, icon: Icon }: { children: ReactNode; icon: typeof Clock3 }) => (
  <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-stone-400">
    <Icon size={14} aria-hidden="true" />
    {children}
  </span>
);

const EditorialCover = ({ article, className = '', compact = false, eyebrow }: { article: PublicWritingCard; className?: string; compact?: boolean; eyebrow?: string }) => {
  const presentation = getEditorialCoverPresentation({
    categories: article.categories,
    resourceType: article.resource_type_detail,
    series: article.series,
    title: article.title,
  });
  const { palette, taxonomy } = presentation;
  const resource = taxonomy.find((level) => level.kind === 'resource');
  const category = taxonomy.find((level) => level.kind === 'category');
  const series = taxonomy.find((level) => level.kind === 'series');
  const title = taxonomy.find((level) => level.kind === 'article')?.label || article.title;
  const description = article.excerpt || article.seo_description;

  return (
    <div
      aria-label={`${article.title} editorial cover`}
      className={`relative isolate flex min-h-full box-border w-full max-w-full min-w-0 overflow-hidden rounded-[1.15rem] ${className}`}
      data-editorial-book-object="true"
      data-resource-card-cover="editorial"
      style={{
        backgroundColor: palette.paper,
        backgroundImage: [
          'linear-gradient(90deg, rgba(0,0,0,0.18), transparent 7%, transparent 92%, rgba(0,0,0,0.12))',
          'repeating-linear-gradient(90deg, rgba(255,255,255,0.038) 0, rgba(255,255,255,0.038) 1px, transparent 1px, transparent 5px)',
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.026) 0, rgba(0,0,0,0.026) 1px, transparent 1px, transparent 6px)',
        ].join(', '),
        boxShadow: `inset 0 0 0 1px ${palette.border}, inset 0 1px 0 rgba(255,255,255,0.12), inset 18px 0 24px rgba(0,0,0,0.22), 0 18px 36px ${palette.glow}`,
        color: palette.text,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-7 sm:w-8"
        style={{
          background: `linear-gradient(90deg, rgba(0,0,0,0.24), ${palette.spine} 38%, rgba(255,255,255,0.08) 58%, transparent)`,
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.12), inset 1px 0 0 rgba(0,0,0,0.34)',
        }}
      />
      <div aria-hidden="true" className="absolute inset-y-0 left-6 w-px bg-white/16 sm:left-7" />
      <div aria-hidden="true" className="absolute inset-y-0 left-9 w-px bg-black/24 sm:left-10" />
      <div aria-hidden="true" className="absolute inset-x-4 top-4 h-px bg-white/12" />
      <div aria-hidden="true" className="absolute inset-x-4 bottom-4 h-px bg-black/18" />

      <div className={`relative z-10 flex min-h-full box-border w-full max-w-full min-w-0 flex-col ${compact ? 'px-5 py-5 pl-11 sm:px-7 sm:py-7 sm:pl-14' : 'px-5 py-6 pl-11 sm:px-7 sm:py-8 sm:pl-14'}`}>
        {eyebrow ? (
          <div className={`max-w-[13rem] text-[9px] font-black uppercase leading-[1.15] tracking-[0.22em] ${compact ? 'mb-2.5' : 'mb-4'}`} style={{ color: palette.accent }}>
            {eyebrow}
          </div>
        ) : null}
        <div className="max-w-full text-[10px] font-black uppercase leading-[1.15] tracking-[0.24em] sm:text-[11px]" style={{ color: palette.text }}>
          {resource?.label || articleAccent(article)}
        </div>

        <div className={`h-px w-10 ${compact ? 'mt-3.5 sm:mt-5' : 'mt-6 sm:mt-7'}`} style={{ backgroundColor: palette.accent }} />

        {category ? (
          <div className={`max-w-full font-serif text-base leading-snug sm:text-lg ${compact ? 'mt-2.5 sm:mt-4' : 'mt-4 sm:mt-5'}`} style={{ color: palette.accent }}>
            {category.label}
          </div>
        ) : null}

        {series ? (
          <div className={`max-w-full text-[9px] font-black uppercase leading-[1.35] tracking-[0.2em] opacity-90 sm:text-[10px] ${compact ? 'mt-2.5 line-clamp-2 sm:mt-4' : 'mt-4'}`}>
            {series.label}
          </div>
        ) : null}

        <div className={`h-px w-9 ${compact ? 'mt-3 sm:mt-4' : 'mt-4 sm:mt-5'}`} style={{ backgroundColor: palette.accent }} />

        <h3 className={`max-w-full font-serif text-[1.1rem] font-semibold leading-[1.06] tracking-[-0.02em] min-[430px]:text-[1.25rem] sm:text-[1.8rem] ${compact ? 'mt-3 line-clamp-2' : 'mt-4'}`}>
          {title}
        </h3>

        {description ? (
          <p className={`max-w-full text-xs font-medium leading-5 opacity-86 sm:text-sm sm:leading-6 ${compact ? 'mt-3 line-clamp-2' : 'mt-5'}`}>
            {description}
          </p>
        ) : null}

        <div className={`mt-auto ${compact ? 'pt-4' : 'pt-8'}`}>
          <div className="h-px w-full bg-white/18" />
          <div className={`mt-4 text-xs font-bold opacity-92 ${compact ? 'flex flex-wrap gap-x-5 gap-y-2' : 'grid gap-2'}`}>
            <span className="inline-flex items-center gap-2">
              <Clock3 size={13} aria-hidden="true" />
              {article.reading_time_minutes || 1} min read
            </span>
            <span className="inline-flex items-start gap-2 leading-5">
              <UsersRound className="mt-0.5 shrink-0" size={13} aria-hidden="true" />
              <span className="line-clamp-2">{articleAuthor(article)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PhotographyCover = ({ article, className = '' }: { article: PublicWritingCard; className?: string }) => {
  const responsiveAsset = normalizeMediaAssetForDisplay(article.og_image_detail);

  return (
    <div className={`relative box-border w-full max-w-full min-w-0 overflow-hidden bg-stone-900 ${className}`} data-resource-card-cover="photography">
      {responsiveAsset ? <ResponsiveImage alt="" asset={responsiveAsset} className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] group-active:scale-[1.02]" preset="card" /> : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.34),transparent_20%),linear-gradient(180deg,transparent,rgba(0,0,0,0.58))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(150deg,transparent_18%,rgba(255,255,255,0.16)_19%,transparent_20%,transparent_32%,rgba(255,255,255,0.11)_33%,transparent_34%)]" />
    </div>
  );
};

const hasArticleCover = (article: PublicWritingCard) => Boolean(normalizeMediaAssetForDisplay(article.og_image_detail));

const Cover = ({ article, className = '' }: { article: PublicWritingCard; className?: string }) => (
  hasArticleCover(article) ? <PhotographyCover article={article} className={className} /> : <EditorialCover article={article} className={className} />
);

const ResourceCard = ({ article, className = '', eyebrow, presentation = 'default', variant = 'compact' }: ResourceCardProps) => {
  const hasCover = hasArticleCover(article);
  const isHero = presentation === 'hero';

  if (!hasCover) {
    const editorialCoverClass = isHero
      ? 'min-h-[18rem] sm:min-h-[21rem] xl:min-h-[32rem]'
      : variant === 'masonry'
        ? 'min-h-[13rem] sm:min-h-[17rem] md:min-h-[18rem]'
        : variant === 'rail'
          ? 'min-h-[17rem] md:min-h-[18rem]'
          : 'min-h-[16rem]';
    const editorialWidthClass = isHero
      ? 'mx-auto w-full max-w-none xl:max-w-[43rem]'
      : variant === 'masonry'
        ? 'w-full'
        : variant === 'rail'
          ? 'w-full max-w-[30rem]'
          : 'w-full max-w-[24rem]';

    return (
      <a
        href={writingHref(article)}
        className={`group block min-w-0 max-w-full rounded-[1.35rem] transition duration-300 ease-out hover:-translate-y-1 active:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 ${editorialWidthClass} ${className}`}
        data-resource-card-mode="editorial-cover-only"
      >
        <EditorialCover article={article} className={`${editorialCoverClass} transition duration-300 ease-out group-hover:shadow-2xl group-active:shadow-xl`} compact={isHero} eyebrow={eyebrow} />
      </a>
    );
  }

  if (variant === 'feature') {
    return (
      <a href={writingHref(article)} className={`group grid box-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl border border-[#eaded0] bg-white shadow-2xl shadow-zinc-900/10 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(17,17,17,0.12)] active:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 dark:hover:shadow-black/50 ${isHero ? 'md:grid-cols-[1.08fr_0.92fr]' : 'xl:grid-cols-[1.12fr_0.88fr]'} ${className}`}>
        <Cover article={article} className={hasCover ? 'min-h-64 md:min-h-[20rem] xl:min-h-[23rem]' : (isHero ? 'min-h-[30rem] lg:min-h-[36rem]' : 'min-h-[28rem] lg:min-h-[32rem]')} />
        <span className={`flex min-w-0 flex-col justify-between p-6 sm:p-8 ${isHero && !hasCover ? 'lg:p-10' : ''}`}>
          <span>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-red-800 dark:text-red-200">{eyebrow || 'Featured Resource'}</span>
            <span className={`mt-4 block max-w-sm font-extrabold leading-tight tracking-normal text-zinc-950 transition-colors duration-300 group-hover:text-red-800 dark:text-stone-100 dark:group-hover:text-red-100 ${isHero && !hasCover ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}>{article.title}</span>
            <span className={`mt-5 block max-w-sm text-zinc-600 dark:text-stone-300 ${isHero && !hasCover ? 'text-lg leading-8' : 'text-base leading-7'}`}>{article.excerpt || article.seo_description}</span>
          </span>
          <span className="mt-7 border-t border-black/10 pt-5 dark:border-white/10">
            <span className="flex flex-wrap gap-x-6 gap-y-3">
              <MetaItem icon={Clock3}>{article.reading_time_minutes || 1} min read</MetaItem>
              <MetaItem icon={UsersRound}>{articleAuthor(article)}</MetaItem>
            </span>
            <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-red-800 dark:text-red-100">
              Read Article
              <ArrowRight size={15} aria-hidden="true" />
            </span>
          </span>
        </span>
      </a>
    );
  }

  if (variant === 'masonry') {
    return (
      <a
        href={writingHref(article)}
        className={`group block box-border w-full max-w-full min-w-0 overflow-hidden rounded-[1.15rem] border border-[#eaded0] bg-white shadow-lg shadow-zinc-900/5 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-900/10 active:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 dark:hover:shadow-black/50 sm:rounded-2xl ${className}`}
        data-resource-card-mode="masonry-image"
      >
        <Cover article={article} className="min-h-[9.5rem] sm:min-h-[13rem] lg:min-h-[14rem]" />
        <span className="block min-w-0 p-3.5 sm:p-5">
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-red-800 transition-colors duration-300 group-hover:text-red-700 dark:text-red-200 dark:group-hover:text-red-100 sm:text-[11px]">{eyebrow || articleAccent(article)}</span>
          <span className="mt-2.5 block text-base font-black leading-snug tracking-normal text-zinc-950 transition-colors duration-300 group-hover:text-red-800 dark:text-stone-100 dark:group-hover:text-red-100 sm:mt-3 sm:text-xl">{article.title}</span>
          <span className="mt-2 hidden text-sm leading-6 text-zinc-600 dark:text-stone-400 sm:line-clamp-2 sm:block">{article.excerpt || article.seo_description || 'Read this writing from the church library.'}</span>
          <span className="mt-3 grid gap-1.5 sm:mt-4 sm:gap-2">
            <MetaItem icon={Clock3}>{article.reading_time_minutes || 1} min read</MetaItem>
            <MetaItem icon={UsersRound}>{articleAuthor(article)}</MetaItem>
          </span>
        </span>
      </a>
    );
  }

  if (variant === 'rail') {
    return (
      <a href={writingHref(article)} className={`group grid box-border w-full max-w-full min-w-0 grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] overflow-hidden sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] rounded-2xl border border-[#eaded0] bg-white shadow-lg shadow-zinc-900/5 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-900/10 active:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 dark:hover:shadow-black/50 ${!hasCover ? 'grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]' : ''} ${className}`}>
        <Cover article={article} className={hasCover ? 'min-h-[13rem] sm:min-h-[15rem]' : 'min-h-[22rem] sm:min-h-[25rem]'} />
        <span className="min-w-0 p-5 sm:p-6">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-red-800 transition-colors duration-300 group-hover:text-red-700 dark:text-red-200 dark:group-hover:text-red-100">{eyebrow || articleAccent(article)}</span>
          <span className="mt-3 block text-xl font-black leading-snug tracking-normal text-zinc-950 transition-colors duration-300 group-hover:text-red-800 dark:text-stone-100 dark:group-hover:text-red-100 sm:text-2xl">{article.title}</span>
          <span className="mt-4 grid gap-2">
            <MetaItem icon={Clock3}>{article.reading_time_minutes || 1} min read</MetaItem>
            <MetaItem icon={UsersRound}>{articleAuthor(article)}</MetaItem>
          </span>
        </span>
      </a>
    );
  }

  return (
    <a href={writingHref(article)} className={`group grid box-border w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-[#eaded0] bg-white shadow-lg shadow-zinc-900/5 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-900/10 active:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40 dark:hover:shadow-black/50 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] ${!hasCover ? 'sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]' : ''} ${className}`}>
      <Cover article={article} className={hasCover ? 'min-h-44 sm:min-h-full' : 'min-h-[22rem] sm:min-h-full'} />
      <span className="min-w-0 p-5">
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-red-800 transition-colors duration-300 group-hover:text-red-700 dark:text-red-200 dark:group-hover:text-red-100">{eyebrow || articleAccent(article)}</span>
        <span className="mt-3 block text-xl font-black leading-snug tracking-normal text-zinc-950 transition-colors duration-300 group-hover:text-red-800 dark:text-stone-100 dark:group-hover:text-red-100">{article.title}</span>
        <span className="mt-3 line-clamp-2 block text-sm leading-6 text-zinc-600 dark:text-stone-400">{article.excerpt || article.seo_description || 'Read this writing from the church library.'}</span>
        <span className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <MetaItem icon={Clock3}>{article.reading_time_minutes || 1} min read</MetaItem>
          <MetaItem icon={UsersRound}>{articleAuthor(article)}</MetaItem>
        </span>
      </span>
    </a>
  );
};

export default ResourceCard;
