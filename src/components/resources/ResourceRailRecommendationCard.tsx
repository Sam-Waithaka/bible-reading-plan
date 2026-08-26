import { ResourcesIcon } from '../../constants/siteIcons';
import { Link } from 'react-router-dom';

import { normalizeMediaAssetForDisplay } from '../../services/mediaAssetsApi';
import type { PublicWritingCard } from '../../types/writing';
import ResponsiveImage from '../media/ResponsiveImage';

type ResourceRailRecommendationCardProps = {
  article: PublicWritingCard;
};

const ResourceRailRecommendationCard = ({ article }: ResourceRailRecommendationCardProps) => {
  const asset = normalizeMediaAssetForDisplay(article.og_image_detail);

  return (
    <Link
      className="group grid grid-cols-[3.25rem_1fr] gap-3 rounded-xl py-2 transition hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-700 dark:hover:text-red-100"
      to={`/resources/${article.slug}`}
    >
      <span className="relative overflow-hidden rounded-lg border border-black/10 bg-[#fffaf0] dark:border-white/10 dark:bg-white/5">
        {asset ? (
          <ResponsiveImage
            alt=""
            asset={asset}
            className="aspect-square size-full object-cover transition duration-300 group-hover:scale-[1.03]"
            preset="card"
          />
        ) : (
          <span className="flex aspect-square size-full items-center justify-center bg-red-900/10 text-red-800 dark:bg-red-200/10 dark:text-red-100">
            <ResourcesIcon size={16} aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-black leading-5 text-zinc-950 transition group-hover:text-red-800 dark:text-stone-100 dark:group-hover:text-red-100">
          {article.title}
        </span>
        <span className="mt-1 block text-xs font-semibold text-zinc-500 dark:text-stone-500">
          {article.resource_type_detail?.name || article.writing_type}
        </span>
      </span>
    </Link>
  );
};

export default ResourceRailRecommendationCard;