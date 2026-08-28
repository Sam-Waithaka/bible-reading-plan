import { ArrowRight, Clock3, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { normalizeMediaAssetForDisplay } from "../../services/mediaAssetsApi";
import { fetchResourcesHome } from "../../services/resourcesApi";
import type {
  PublicResourceSeries,
  PublicWritingCard,
  ResourcesHome,
} from "../../types/writing";
import { getEditorialCoverPresentation } from "../../utils/resourceEditorialPresentation";
import { selectHomeResourcesHighlightContent } from "../../utils/homeResourcesHighlightSelection";
import ResponsiveImage from "../media/ResponsiveImage";
import SiteButton from "../ui/SiteButton";

type HomeResourcesHighlightProps = { darkMode: boolean };
type HomeWritingCardProps = {
  article: PublicWritingCard;
  role: "anchor" | "supporting";
};

const articleLabel = (article: PublicWritingCard) =>
  article.resource_type_detail?.name || article.writing_type || "Resource";
const articleDescription = (article: PublicWritingCard) =>
  article.excerpt || article.seo_description;
const articleAuthor = (article: PublicWritingCard) =>
  article.byline || article.author_display || "A.I.C Njoro Town";

const HomeWritingCard = ({ article, role }: HomeWritingCardProps) => {
  const image = normalizeMediaAssetForDisplay(article.og_image_detail);
  const editorial = getEditorialCoverPresentation({
    categories: article.categories,
    resourceType: article.resource_type_detail,
    series: article.series,
    title: article.title,
  });
  const category = editorial.taxonomy.find(
    (level) => level.kind === "category",
  )?.label;
  const isAnchor = role === "anchor";

  if (image) {
    return (
      <Link
        className="group flex size-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#e7ded0] bg-white text-zinc-950 shadow-md transition duration-300 [container-type:inline-size] hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 dark:border-white/10 dark:bg-zinc-950 dark:text-stone-100 sm:rounded-2xl"
        to={`/resources/${article.slug}`}
      >
        <span
          className={`relative block min-h-0 min-w-0 overflow-hidden bg-zinc-900 ${isAnchor ? "basis-[48%]" : "basis-[56%]"}`}
        >
          <ResponsiveImage
            alt=""
            asset={image}
            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
            preset="card"
          />
          <span
            className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10"
            aria-hidden="true"
          />
          <span className="absolute left-3 top-3 rounded-full bg-[#12213f]/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white sm:left-4 sm:top-4 sm:text-[10px]">
            {articleLabel(article)}
          </span>
        </span>
        <span
          className={`flex min-h-0 min-w-0 flex-1 flex-col p-3.5 sm:p-5 ${isAnchor ? "justify-between" : ""}`}
        >
          <span
            className={`block text-balance font-serif font-semibold leading-[1.02] [hyphens:none] [overflow-wrap:normal] [word-break:normal] ${isAnchor ? "line-clamp-4 text-[clamp(1rem,9cqi,1.75rem)]" : "line-clamp-3 text-[clamp(.9rem,7cqi,1.35rem)]"}`}
          >
            {article.title}
          </span>
          {isAnchor && articleDescription(article) ? (
            <span className="mt-3 line-clamp-4 text-xs leading-5 text-zinc-600 dark:text-stone-300 sm:line-clamp-none sm:text-sm">
              {articleDescription(article)}
            </span>
          ) : null}
          <span className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-semibold text-zinc-600 dark:text-stone-400 sm:text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={13} aria-hidden="true" />
              {article.reading_time_minutes || 1} min read
            </span>
            {isAnchor ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <UsersRound className="shrink-0" size={13} aria-hidden="true" />
                <span className="truncate">{articleAuthor(article)}</span>
              </span>
            ) : null}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      className="group relative isolate flex size-full min-w-0 flex-col overflow-hidden rounded-xl text-white shadow-md transition duration-300 [container-type:inline-size] hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 sm:rounded-2xl"
      style={{
        backgroundColor: editorial.palette.paper,
        backgroundImage:
          "linear-gradient(90deg,rgba(0,0,0,.2),transparent 10%,transparent 88%,rgba(0,0,0,.12)),repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0,rgba(255,255,255,.035) 1px,transparent 1px,transparent 5px)",
        boxShadow: `inset 0 0 0 1px ${editorial.palette.border}, inset 18px 0 28px rgba(0,0,0,.2), 0 14px 28px ${editorial.palette.glow}`,
      }}
      to={`/resources/${article.slug}`}
    >
      <span
        className="absolute inset-y-0 left-0 w-7 bg-black/20 shadow-[inset_-1px_0_rgba(255,255,255,.12)]"
        aria-hidden="true"
      />
      <span
        className="absolute inset-y-8 right-5 w-24 rounded-full border border-white/10 opacity-40"
        aria-hidden="true"
      />

      <span
        className={`relative z-10 flex size-full min-w-0 flex-col ${isAnchor ? "p-5 pl-10 sm:p-7 sm:pl-12" : "p-4 sm:p-5"}`}
      >
        <span
          className="text-[9px] font-black uppercase tracking-[0.18em] sm:text-[10px]"
          style={{ color: editorial.palette.accent }}
        >
          {articleLabel(article)}
        </span>
        <span
          className="mt-3 h-px w-10"
          style={{ backgroundColor: editorial.palette.accent }}
          aria-hidden="true"
        />

        <span className="mt-auto min-w-0">
          {category && isAnchor ? (
            <span
              className="mb-3 block font-serif text-sm"
              style={{ color: editorial.palette.accent }}
            >
              {category}
            </span>
          ) : null}
          <span
            className={`block text-balance font-serif font-semibold leading-[1.02] [hyphens:none] [overflow-wrap:normal] [word-break:normal] ${isAnchor ? "line-clamp-5 text-[clamp(1rem,10cqi,1.875rem)]" : "line-clamp-4 text-[clamp(.9rem,8cqi,1.45rem)]"}`}
          >
            {article.title}
          </span>
          {isAnchor && articleDescription(article) ? (
            <span className="mt-4 line-clamp-4 text-xs leading-5 text-stone-100/90 sm:line-clamp-none sm:text-sm sm:leading-6">
              {articleDescription(article)}
            </span>
          ) : null}
          <span
            className={`mt-4 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-semibold text-stone-100 sm:text-xs ${isAnchor ? "sm:mt-7" : ""}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={13} aria-hidden="true" />
              {article.reading_time_minutes || 1} min read
            </span>
            {isAnchor ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <UsersRound className="shrink-0" size={13} aria-hidden="true" />
                <span className="truncate">{articleAuthor(article)}</span>
              </span>
            ) : null}
          </span>
        </span>
      </span>
    </Link>
  );
};

const FeaturedSeriesTile = ({ series }: { series: PublicResourceSeries }) => {
  const cover = normalizeMediaAssetForDisplay(series.cover_image_detail);

  return (
    <Link
      className="group relative isolate flex size-full min-w-0 flex-col justify-end overflow-hidden rounded-xl bg-[#4b4a28] p-4 text-[#fff9e9] shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 sm:rounded-2xl sm:p-5"
      to={`/resources/series/${series.slug}`}
    >
      {cover ? (
        <>
          <ResponsiveImage
            alt=""
            asset={cover}
            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
            preset="card"
          />
          <span
            className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15"
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          <span
            className="absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(210,165,72,.18),transparent_30%),linear-gradient(135deg,#55532d,#33351f)]"
            aria-hidden="true"
          />
        </>
      )}
      <span className="relative z-10 max-w-full min-w-0">
        <span className="inline-flex rounded-full bg-[#f4e9c9] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-[#413d20] sm:text-[9px]">
          Featured Series
        </span>
        <span className="mt-2 line-clamp-3 block break-words font-serif text-base font-semibold leading-[1.05] sm:text-xl">
          {series.title}
        </span>
        <span className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold sm:text-xs">
          {series.writing_count}{" "}
          {series.writing_count === 1 ? "resource" : "resources"}{" "}
          <span aria-hidden="true">·</span> Start the journey{" "}
          <ArrowRight size={13} aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
};

const HomeResourcesHighlight = ({ darkMode }: HomeResourcesHighlightProps) => {
  const [home, setHome] = useState<ResourcesHome | null>(null);
  const [status, setStatus] = useState<"empty" | "loading" | "ready">(
    "loading",
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchResourcesHome(controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setHome(payload);
        setStatus(
          selectHomeResourcesHighlightContent(payload) ? "ready" : "empty",
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setHome(null);
          setStatus("empty");
        }
      });
    return () => controller.abort();
  }, []);

  const content = useMemo(
    () => (home ? selectHomeResourcesHighlightContent(home) : null),
    [home],
  );
  const loading = status === "loading";
  if (!loading && !content) return null;

  const anchor = content?.writings[0] ?? null;
  const supporting = content?.writings[1] ?? null;
  const thirdWriting = content?.writings[2] ?? null;
  const lowerItem = content?.series
    ? { kind: "series" as const, series: content.series }
    : thirdWriting
      ? { kind: "writing" as const, writing: thirdWriting }
      : null;
  const hasFullShelf = loading || content?.layout === "shelf";

  return (
    <section
      aria-busy={loading}
      className={`w-full max-w-full min-w-0 box-border px-4 py-14 sm:px-6 sm:py-20 lg:px-8 xl:px-5 xl:py-24 ${darkMode ? "bg-[#080808]" : "bg-[#f8f5ef]"}`}
      id="resources-highlight"
    >
      <div
        className={`mx-auto w-full max-w-[1440px] min-w-0 rounded-[1.75rem] border p-3 shadow-xl sm:p-6 lg:p-8 xl:max-w-[calc(100vw-2.5rem)] xl:p-12 ${darkMode ? "border-white/10 bg-[#11100e] shadow-black/40" : "border-[#e7ded0] bg-[#fcfaf6] shadow-zinc-900/10"}`}
      >
        <div className="grid min-w-0 gap-6 lg:gap-8 xl:grid-cols-[minmax(0,1.42fr)_minmax(18rem,.78fr)] xl:items-stretch xl:gap-12">
          <div className="min-w-0 xl:order-2 xl:flex xl:flex-col xl:justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-800 dark:text-red-200 sm:text-xs">
              From the library
            </p>
            <h2
              className={`mt-2 max-w-xl font-serif text-[clamp(1.65rem,3.3vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] ${darkMode ? "text-stone-100" : "text-zinc-950"}`}
            >
              Go further. Stay rooted.
            </h2>
            <span className="mt-4 h-0.5 w-10 bg-red-800" aria-hidden="true" />
            <p
              className={`mt-4 hidden max-w-sm text-sm leading-6 sm:block ${darkMode ? "text-stone-300" : "text-zinc-700"}`}
            >
              <strong className="font-semibold">
                Truth worth returning to.
              </strong>{" "}
              Bible studies, reflections, ministry resources, and thoughtful
              writing for life with Christ.
            </p>
            <div className="mt-5 hidden md:block">
              <SiteButton
                darkMode={darkMode}
                icon={ArrowRight}
                iconPosition="after"
                to="/resources"
                variant="primary"
              >
                Explore Resources
              </SiteButton>
            </div>
          </div>

          <div
            className={`grid min-h-[20rem] min-w-0 grid-cols-2 gap-2.5 sm:min-h-[28rem] sm:gap-3 md:min-h-[31rem] xl:order-1 xl:min-h-[34rem] xl:gap-4 ${hasFullShelf ? "grid-rows-[1.08fr_.82fr]" : "grid-rows-1"}`}
          >
            {loading ? (
              <>
                <div
                  aria-label="Loading latest resource"
                  className={`row-span-2 animate-pulse rounded-xl border sm:rounded-2xl ${darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-black/[0.05]"}`}
                />
                <div
                  aria-hidden="true"
                  className={`animate-pulse rounded-xl border sm:rounded-2xl ${darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-black/[0.05]"}`}
                />
                <div
                  aria-hidden="true"
                  className={`animate-pulse rounded-xl border sm:rounded-2xl ${darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-black/[0.05]"}`}
                />
              </>
            ) : anchor ? (
              <>
                <div
                  className={`${hasFullShelf ? "row-span-2" : supporting ? "" : "col-span-2"} min-w-0`}
                >
                  <HomeWritingCard article={anchor} role="anchor" />
                </div>
                {supporting ? (
                  <div className="min-w-0">
                    <HomeWritingCard article={supporting} role="supporting" />
                  </div>
                ) : null}
                {lowerItem ? (
                  <div className="min-w-0">
                    {lowerItem.kind === "series" ? (
                      <FeaturedSeriesTile series={lowerItem.series} />
                    ) : (
                      <HomeWritingCard
                        article={lowerItem.writing}
                        role="supporting"
                      />
                    )}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="md:hidden">
            <SiteButton
              className="w-full"
              darkMode={darkMode}
              icon={ArrowRight}
              iconPosition="after"
              to="/resources"
              variant="primary"
            >
              Explore Resources
            </SiteButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeResourcesHighlight;
