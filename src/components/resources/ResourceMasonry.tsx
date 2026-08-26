import type { PublicWritingCard } from '../../types/writing';
import ResourceCard from './ResourceCard';

type ResourceMasonryProps = {
  articles: PublicWritingCard[];
  className?: string;
  eyebrow?: string;
  limit?: number;
  shelf: string;
};

const ResourceMasonry = ({
  articles,
  className = '',
  eyebrow,
  limit,
  shelf,
}: ResourceMasonryProps) => {
  const visibleArticles = typeof limit === 'number' ? articles.slice(0, limit) : articles;

  return (
    <div
      className={`box-border w-full max-w-full min-w-0 columns-2 gap-3 sm:gap-5 xl:columns-3 xl:gap-7 ${className}`}
      data-resources-article-shelf={shelf === 'taxonomy' ? 'true' : undefined}
      data-resources-masonry-shelf={shelf}
    >
      {visibleArticles.map((article) => (
        <ResourceCard
          article={article}
          className="mb-3 w-full max-w-full break-inside-avoid sm:mb-5 xl:mb-7"
          eyebrow={eyebrow}
          key={article.id}
          variant="masonry"
        />
      ))}
    </div>
  );
};

export default ResourceMasonry;
