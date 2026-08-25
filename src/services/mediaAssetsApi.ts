import { ApiError, createApiUrl } from './apiClient';
import { authenticatedFetch } from './authSession';
import type { PaginatedResponse, WritingMediaAsset } from '../types/writing';

export type MediaAssetStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | string;
export type MediaVariantFormat = 'avif' | 'webp' | 'jpeg';
export type MediaVariantSize = 'thumb' | 'small' | 'medium' | 'large';

export type MediaVariant = {
  file_size: number | null;
  format: MediaVariantFormat | string;
  generated_at: string | null;
  height: number | null;
  id: number | string;
  quality: number | null;
  size_name: MediaVariantSize | string;
  status: MediaAssetStatus;
  url: string | null;
  width: number | null;
};

export type MediaVariantMap = Partial<Record<MediaVariantFormat, Partial<Record<MediaVariantSize, MediaVariant>>>>;

export type MediaAsset = WritingMediaAsset & {
  caption: string;
  height: number | null;
  original_url: string | null;
  status: MediaAssetStatus;
  uuid: string;
  variant_map: MediaVariantMap;
  variants: MediaVariant[];
  width: number | null;
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const readDetail = (payload: unknown) => {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  const detail = record.detail || record.message || record.error;
  return typeof detail === 'string' ? detail : undefined;
};

const mediaRequest = async <T>(path: string, accessToken: string, init: RequestInit = {}) => {
  const endpoint = createApiUrl(path);
  const response = await authenticatedFetch(endpoint, accessToken, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    const detail = readDetail(payload);
    throw new ApiError(detail || 'Media request failed.', {
      detail,
      endpoint,
      status: response.status,
    });
  }

  return payload as T;
};

export const normalizeMediaAssetPage = (payload: unknown): PaginatedResponse<MediaAsset> => {
  if (Array.isArray(payload)) return { count: payload.length, results: payload as MediaAsset[] };
  if (!payload || typeof payload !== 'object') return { count: 0, results: [] };

  const record = payload as Partial<PaginatedResponse<MediaAsset>>;
  return {
    count: typeof record.count === 'number' ? record.count : Array.isArray(record.results) ? record.results.length : 0,
    next: record.next ?? null,
    previous: record.previous ?? null,
    results: Array.isArray(record.results) ? record.results : [],
  };
};

export const fetchMediaAssets = async (accessToken: string, signal?: AbortSignal) =>
  normalizeMediaAssetPage(await mediaRequest<unknown>('/v1/media-assets/', accessToken, { signal }));

export const fetchMediaAsset = (accessToken: string, id: number | string, signal?: AbortSignal) =>
  mediaRequest<MediaAsset>(`/v1/media-assets/${id}/`, accessToken, { signal });

export const uploadMediaAsset = async (
  accessToken: string,
  file: File,
  metadata: { altText?: string; caption?: string; title?: string } = {},
) => {
  const body = new FormData();
  body.append('original_file', file);
  body.append('title', metadata.title || file.name);
  body.append('alt_text', metadata.altText || '');
  body.append('caption', metadata.caption || '');

  return mediaRequest<MediaAsset>('/v1/media-assets/', accessToken, {
    body,
    method: 'POST',
  });
};

const mediaVariantSizes: MediaVariantSize[] = ['thumb', 'small', 'medium', 'large'];
const mediaVariantFormatOrder: MediaVariantFormat[] = ['avif', 'webp', 'jpeg'];

export const isReadyMediaStatus = (status?: string | null) => !status || status.toLowerCase() === 'ready';

const legacyMediaUrl = (asset?: WritingMediaAsset | null) => asset?.url || asset?.image || asset?.file || '';

export const normalizeMediaAssetForDisplay = (asset?: WritingMediaAsset | MediaAsset | null): MediaAsset | null => {
  if (!asset) return null;
  const record = asset as WritingMediaAsset & Partial<MediaAsset>;
  const originalUrl = record.original_url || legacyMediaUrl(asset) || null;
  const variants = Array.isArray(record.variants) ? record.variants : [];
  const variantMap = record.variant_map || {};
  const hasVariantUrl = variants.some((variant) => Boolean(variant.url))
    || mediaVariantFormatOrder.some((format) => mediaVariantSizes.some((size) => Boolean(variantMap[format]?.[size]?.url)));

  if (!originalUrl && !hasVariantUrl) return null;

  return {
    ...record,
    caption: record.caption || '',
    height: record.height ?? null,
    original_url: originalUrl,
    status: record.status || 'ready',
    uuid: record.uuid || String(record.id),
    variant_map: variantMap,
    variants,
    width: record.width ?? null,
  };
};

const isReadyVariant = (variant?: MediaVariant | null): variant is MediaVariant => Boolean(variant?.url && isReadyMediaStatus(variant.status));

export const readyMediaVariants = (asset: MediaAsset | null | undefined, format: MediaVariantFormat) => {
  if (!asset || !isReadyMediaStatus(asset.status)) return [];

  const fromMap = mediaVariantSizes
    .map((size) => asset.variant_map?.[format]?.[size])
    .filter(isReadyVariant);
  const fromList = (asset.variants || [])
    .filter((variant): variant is MediaVariant => variant.format === format && isReadyVariant(variant));
  const seen = new Set<string>();

  return [...fromMap, ...fromList].filter((variant) => {
    const key = [variant.format, variant.size_name, variant.width, variant.url].join(':');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const mediaAssetImageUrl = (asset?: MediaAsset | WritingMediaAsset | null, preferredSize: MediaVariantSize = 'medium') => {
  const displayAsset = normalizeMediaAssetForDisplay(asset);
  if (!displayAsset || !isReadyMediaStatus(displayAsset.status)) return '';

  for (const format of mediaVariantFormatOrder) {
    const variants = readyMediaVariants(displayAsset, format);
    const preferredVariant = variants.find((variant) => variant.size_name === preferredSize) || variants[0];
    if (preferredVariant?.url) return preferredVariant.url;
  }

  return displayAsset.original_url || '';
};
