import { useEffect, useState } from 'react';
import { isReadyMediaStatus, normalizeMediaAssetForDisplay, readyMediaVariants, type MediaAsset, type MediaVariant } from '../../services/mediaAssetsApi';

export type ResponsiveImagePreset = 'articleCover' | 'card' | 'hero' | 'thumbnail';

const imagePresets: Record<ResponsiveImagePreset, { sizes: string }> = {
  articleCover: { sizes: '(max-width: 1024px) 100vw, 56rem' },
  card: { sizes: '(max-width: 640px) 92vw, 20rem' },
  hero: { sizes: '100vw' },
  thumbnail: { sizes: '160px' },
};

const toSrcSet = (variants: MediaVariant[]) => variants
  .filter((variant) => variant.url && variant.width)
  .map((variant) => `${variant.url} ${variant.width}w`)
  .join(', ');

const firstReadyVariant = (asset: MediaAsset) =>
  readyMediaVariants(asset, 'avif')[0]
  || readyMediaVariants(asset, 'webp')[0]
  || readyMediaVariants(asset, 'jpeg')[0];

type ResponsiveImageProps = {
  alt?: string;
  asset: MediaAsset | null | undefined;
  className?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  loading?: 'eager' | 'lazy';
  onRefreshAsset?: () => Promise<MediaAsset | null>;
  preset: ResponsiveImagePreset;
  sizes?: string;
};

const ResponsiveImage = ({
  alt,
  asset,
  className,
  fetchPriority,
  loading = 'lazy',
  onRefreshAsset,
  preset,
  sizes,
}: ResponsiveImageProps) => {
  const [activeAsset, setActiveAsset] = useState(asset);
  const [hasRetried, setHasRetried] = useState(false);

  useEffect(() => {
    setActiveAsset(asset);
    setHasRetried(false);
  }, [asset]);

  const displayAsset = normalizeMediaAssetForDisplay(activeAsset);
  if (!displayAsset || !isReadyMediaStatus(displayAsset.status)) return null;

  const avif = readyMediaVariants(displayAsset, 'avif');
  const webp = readyMediaVariants(displayAsset, 'webp');
  const jpeg = readyMediaVariants(displayAsset, 'jpeg');
  const fallbackVariant = firstReadyVariant(displayAsset);
  const fallbackUrl = jpeg[0]?.url || fallbackVariant?.url || displayAsset.original_url;

  if (!fallbackUrl) return null;

  const width = displayAsset.width || fallbackVariant?.width || undefined;
  const height = displayAsset.height || fallbackVariant?.height || undefined;
  const resolvedAlt = alt ?? displayAsset.alt_text ?? displayAsset.title ?? '';

  const handleError = async () => {
    if (hasRetried || !onRefreshAsset) return;
    setHasRetried(true);
    try {
      const refreshedAsset = await onRefreshAsset();
      if (refreshedAsset) setActiveAsset(refreshedAsset);
    } catch {
      // The original image failure remains visible; do not retry indefinitely.
    }
  };

  const avifSrcSet = toSrcSet(avif);
  const webpSrcSet = toSrcSet(webp);
  const jpegSrcSet = toSrcSet(jpeg);
  const resolvedSizes = sizes || imagePresets[preset].sizes;

  return (
    <picture>
      {avifSrcSet ? <source srcSet={avifSrcSet} sizes={resolvedSizes} type="image/avif" /> : null}
      {webpSrcSet ? <source srcSet={webpSrcSet} sizes={resolvedSizes} type="image/webp" /> : null}
      <img
        alt={resolvedAlt}
        className={className}
        decoding="async"
        fetchPriority={fetchPriority}
        height={height}
        loading={loading}
        onError={() => { void handleError(); }}
        sizes={resolvedSizes}
        src={fallbackUrl}
        srcSet={jpegSrcSet || undefined}
        width={width}
      />
    </picture>
  );
};

export default ResponsiveImage;



