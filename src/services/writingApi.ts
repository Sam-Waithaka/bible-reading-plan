import { ApiError, createApiUrl } from './apiClient';
import { invalidateResourcesCache } from './resourcesApi';
import { authenticatedFetch } from './authSession';
import type {
  EditorialQueueFilters,
  EditorialQueueItem,
  MediaAssetUsage,
  PaginatedResponse,
  Writing,
  WritingCategory,
  WritingCategorySeriesLink,
  WritingCreatePayload,
  WritingFilters,
  WritingMediaEmbed,
  WritingResourceType,
  WritingResourceTypeCategoryLink,
  WritingScriptureReference,
  WritingScriptureReferenceCreatePayload,
  WritingScriptureReferencePayload,
  WritingSeries,
  WritingSeriesItem,
  WritingTag,
  WritingUpdatePayload,
  WritingWorkflowNote,
  WritingWorkflowNoteCreatePayload,
  WritingWorkflowNoteUpdatePayload,
} from '../types/writing';

type PortalRequestOptions = {
  accessToken: string;
  body?: unknown;
  invalidateResources?: boolean;
  method?: 'DELETE' | 'GET' | 'PATCH' | 'POST';
  signal?: AbortSignal;
};

const emptyPage = <T>(): PaginatedResponse<T> => ({ count: 0, results: [] });

const parseJson = async (response: Response) => {
  if (response.status === 204) return null;
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

const portalRequest = async <T>(path: string, options: PortalRequestOptions): Promise<T> => {
  const endpoint = createApiUrl(path);
  const response = await authenticatedFetch(endpoint, options.accessToken, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${options.accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    method: options.method ?? 'GET',
    signal: options.signal,
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    const detail = readDetail(payload);
    throw new ApiError(detail || 'Writing Studio request failed.', {
      detail,
      endpoint,
      status: response.status,
    });
  }

  if (options.invalidateResources) {
    invalidateResourcesCache();
  }

  return payload as T;
};

const toQueryString = (filters: WritingFilters | EditorialQueueFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === 'ALL') return;
    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const normalizePage = <T>(payload: unknown): PaginatedResponse<T> => {
  if (Array.isArray(payload)) return { count: payload.length, results: payload as T[] };
  if (!payload || typeof payload !== 'object') return emptyPage<T>();
  const record = payload as Partial<PaginatedResponse<T>>;
  return {
    count: typeof record.count === 'number' ? record.count : Array.isArray(record.results) ? record.results.length : 0,
    next: record.next ?? null,
    previous: record.previous ?? null,
    results: Array.isArray(record.results) ? record.results : [],
  };
};

export const fetchWritings = async (accessToken: string, filters?: WritingFilters, signal?: AbortSignal) =>
  normalizePage<Writing>(await portalRequest<unknown>(`/v1/writings/${toQueryString(filters)}`, { accessToken, signal }));

export const fetchEditorialQueue = async (accessToken: string, filters?: EditorialQueueFilters, signal?: AbortSignal) =>
  normalizePage<EditorialQueueItem>(await portalRequest<unknown>(`/v1/writings/editorial-queue/${toQueryString(filters)}`, { accessToken, signal }));

export const fetchWriting = (accessToken: string, id: string | number, signal?: AbortSignal) =>
  portalRequest<Writing>(`/v1/writings/${id}/`, { accessToken, signal });

export const createWriting = (accessToken: string, body: WritingCreatePayload) =>
  portalRequest<Writing>('/v1/writings/', { accessToken, body, method: 'POST' });

export const updateWriting = (accessToken: string, id: string | number, body: WritingUpdatePayload) =>
  portalRequest<Writing>(`/v1/writings/${id}/`, { accessToken, body, method: 'PATCH' }).then((writing) => {
    if (writing.status === 'PUBLISHED') invalidateResourcesCache();
    return writing;
  });

export const publishWriting = (accessToken: string, id: string | number) =>
  portalRequest<Writing>(`/v1/writings/${id}/publish/`, { accessToken, invalidateResources: true, method: 'POST' });

export const approveWriting = (accessToken: string, id: string | number) =>
  portalRequest<Writing>(`/v1/writings/${id}/approve/`, { accessToken, method: 'POST' });

export const archiveWriting = (accessToken: string, id: string | number) =>
  portalRequest<Writing>(`/v1/writings/${id}/archive/`, { accessToken, invalidateResources: true, method: 'POST' });

export const createWritingRevision = (accessToken: string, id: string | number) =>
  portalRequest<Writing>(`/v1/writings/${id}/create-revision/`, { accessToken, method: 'POST' });
export const submitWritingForReview = (accessToken: string, id: string | number, note = '') =>
  portalRequest<Writing>(`/v1/writings/${id}/submit-for-review/`, { accessToken, body: { note }, method: 'POST' });

export const returnWritingToDraft = (accessToken: string, id: string | number, note = '') =>
  portalRequest<Writing>(`/v1/writings/${id}/return-to-draft/`, { accessToken, body: { note }, method: 'POST' });

export const scheduleWriting = (accessToken: string, id: string | number, scheduledFor: string) =>
  portalRequest<Writing>(`/v1/writings/${id}/schedule/`, { accessToken, body: { scheduled_for: scheduledFor }, invalidateResources: true, method: 'POST' });

export const unscheduleWriting = (accessToken: string, id: string | number) =>
  portalRequest<Writing>(`/v1/writings/${id}/unschedule/`, { accessToken, invalidateResources: true, method: 'POST' });
export const featureWriting = (accessToken: string, id: string | number) =>
  portalRequest<Writing>(`/v1/writings/${id}/feature/`, { accessToken, invalidateResources: true, method: 'POST' });

export const unfeatureWriting = (accessToken: string, id: string | number) =>
  portalRequest<Writing>(`/v1/writings/${id}/unfeature/`, { accessToken, invalidateResources: true, method: 'POST' });

export const fetchResourceTypes = async (accessToken: string, signal?: AbortSignal) =>
  normalizePage<WritingResourceType>(await portalRequest<unknown>('/v1/writing-resource-types/', { accessToken, signal }));

export const fetchResourceType = (accessToken: string, id: string | number, signal?: AbortSignal) =>
  portalRequest<WritingResourceType>(`/v1/writing-resource-types/${id}/`, { accessToken, signal });

export const createResourceType = (accessToken: string, body: Partial<WritingResourceType>) =>
  portalRequest<WritingResourceType>('/v1/writing-resource-types/', { accessToken, body, invalidateResources: true, method: 'POST' });

export const updateResourceType = (accessToken: string, id: string | number, body: Partial<WritingResourceType>) =>
  portalRequest<WritingResourceType>(`/v1/writing-resource-types/${id}/`, { accessToken, body, invalidateResources: true, method: 'PATCH' });

export const deleteResourceType = (accessToken: string, id: string | number) =>
  portalRequest<null>(`/v1/writing-resource-types/${id}/`, { accessToken, invalidateResources: true, method: 'DELETE' });

export const fetchCategories = async (accessToken: string, signal?: AbortSignal) =>
  normalizePage<WritingCategory>(await portalRequest<unknown>('/v1/writing-categories/', { accessToken, signal }));

export const fetchCategory = (accessToken: string, id: string | number, signal?: AbortSignal) =>
  portalRequest<WritingCategory>(`/v1/writing-categories/${id}/`, { accessToken, signal });

export const createCategory = (accessToken: string, body: Partial<WritingCategory>) =>
  portalRequest<WritingCategory>('/v1/writing-categories/', { accessToken, body, invalidateResources: true, method: 'POST' });

export const updateCategory = (accessToken: string, id: string | number, body: Partial<WritingCategory>) =>
  portalRequest<WritingCategory>(`/v1/writing-categories/${id}/`, { accessToken, body, invalidateResources: true, method: 'PATCH' });

export const deleteCategory = (accessToken: string, id: string | number) =>
  portalRequest<null>(`/v1/writing-categories/${id}/`, { accessToken, invalidateResources: true, method: 'DELETE' });

export const fetchSeries = async (accessToken: string, signal?: AbortSignal) =>
  normalizePage<WritingSeries>(await portalRequest<unknown>('/v1/writing-series/', { accessToken, signal }));

export const fetchSeriesDetail = (accessToken: string, id: string | number, signal?: AbortSignal) =>
  portalRequest<WritingSeries>(`/v1/writing-series/${id}/`, { accessToken, signal });

export const createSeries = (accessToken: string, body: Partial<WritingSeries>) =>
  portalRequest<WritingSeries>('/v1/writing-series/', { accessToken, body, invalidateResources: true, method: 'POST' });

export const updateSeries = (accessToken: string, id: string | number, body: Partial<WritingSeries>) =>
  portalRequest<WritingSeries>(`/v1/writing-series/${id}/`, { accessToken, body, invalidateResources: true, method: 'PATCH' });

export const deleteSeries = (accessToken: string, id: string | number) =>
  portalRequest<null>(`/v1/writing-series/${id}/`, { accessToken, invalidateResources: true, method: 'DELETE' });

export const fetchWritingSeriesItems = async (accessToken: string, seriesId: string | number, signal?: AbortSignal) =>
  normalizePage<WritingSeriesItem>(await portalRequest<unknown>(`/v1/writing-series-items/?series=${encodeURIComponent(String(seriesId))}`, { accessToken, signal }));

export const createWritingSeriesItem = (accessToken: string, body: { order?: number; series: number | string; writing: number | string }) =>
  portalRequest<WritingSeriesItem>('/v1/writing-series-items/', { accessToken, body, invalidateResources: true, method: 'POST' });

export const updateWritingSeriesItem = (accessToken: string, id: string | number, body: Partial<Pick<WritingSeriesItem, 'order'>>) =>
  portalRequest<WritingSeriesItem>(`/v1/writing-series-items/${id}/`, { accessToken, body, invalidateResources: true, method: 'PATCH' });

export const deleteWritingSeriesItem = (accessToken: string, id: string | number) =>
  portalRequest<null>(`/v1/writing-series-items/${id}/`, { accessToken, invalidateResources: true, method: 'DELETE' });

export const reorderWritingSeriesItems = (accessToken: string, seriesId: string | number, items: Array<{ id: number | string; order: number }>) =>
  portalRequest<WritingSeriesItem[]>(`/v1/writing-series/${seriesId}/reorder-items/`, { accessToken, body: { items }, invalidateResources: true, method: 'POST' });

export const fetchWritingTags = async (accessToken: string, signal?: AbortSignal) =>
  normalizePage<WritingTag>(await portalRequest<unknown>('/v1/writing-tags/', { accessToken, signal }));

export const fetchWritingTag = (accessToken: string, id: string | number, signal?: AbortSignal) =>
  portalRequest<WritingTag>(`/v1/writing-tags/${id}/`, { accessToken, signal });

export const createWritingTag = (accessToken: string, body: Partial<WritingTag>) =>
  portalRequest<WritingTag>('/v1/writing-tags/', { accessToken, body, invalidateResources: true, method: 'POST' });

export const updateWritingTag = (accessToken: string, id: string | number, body: Partial<WritingTag>) =>
  portalRequest<WritingTag>(`/v1/writing-tags/${id}/`, { accessToken, body, invalidateResources: true, method: 'PATCH' });

export const deleteWritingTag = (accessToken: string, id: string | number) =>
  portalRequest<null>(`/v1/writing-tags/${id}/`, { accessToken, invalidateResources: true, method: 'DELETE' });

export const fetchResourceTypeCategoryLinks = async (accessToken: string, signal?: AbortSignal) =>
  normalizePage<WritingResourceTypeCategoryLink>(await portalRequest<unknown>('/v1/writing-resource-type-categories/', { accessToken, signal }));

export const fetchResourceTypeCategoryLink = (accessToken: string, id: string | number, signal?: AbortSignal) =>
  portalRequest<WritingResourceTypeCategoryLink>(`/v1/writing-resource-type-categories/${id}/`, { accessToken, signal });

export const createResourceTypeCategoryLink = (accessToken: string, body: Partial<WritingResourceTypeCategoryLink>) =>
  portalRequest<WritingResourceTypeCategoryLink>('/v1/writing-resource-type-categories/', { accessToken, body, invalidateResources: true, method: 'POST' });

export const updateResourceTypeCategoryLink = (accessToken: string, id: string | number, body: Partial<WritingResourceTypeCategoryLink>) =>
  portalRequest<WritingResourceTypeCategoryLink>(`/v1/writing-resource-type-categories/${id}/`, { accessToken, body, invalidateResources: true, method: 'PATCH' });

export const deleteResourceTypeCategoryLink = (accessToken: string, id: string | number) =>
  portalRequest<null>(`/v1/writing-resource-type-categories/${id}/`, { accessToken, invalidateResources: true, method: 'DELETE' });

export const fetchCategorySeriesLinks = async (accessToken: string, signal?: AbortSignal) =>
  normalizePage<WritingCategorySeriesLink>(await portalRequest<unknown>('/v1/writing-category-series/', { accessToken, signal }));

export const fetchCategorySeriesLink = (accessToken: string, id: string | number, signal?: AbortSignal) =>
  portalRequest<WritingCategorySeriesLink>(`/v1/writing-category-series/${id}/`, { accessToken, signal });

export const createCategorySeriesLink = (accessToken: string, body: Partial<WritingCategorySeriesLink>) =>
  portalRequest<WritingCategorySeriesLink>('/v1/writing-category-series/', { accessToken, body, invalidateResources: true, method: 'POST' });

export const updateCategorySeriesLink = (accessToken: string, id: string | number, body: Partial<WritingCategorySeriesLink>) =>
  portalRequest<WritingCategorySeriesLink>(`/v1/writing-category-series/${id}/`, { accessToken, body, invalidateResources: true, method: 'PATCH' });

export const deleteCategorySeriesLink = (accessToken: string, id: string | number) =>
  portalRequest<null>(`/v1/writing-category-series/${id}/`, { accessToken, invalidateResources: true, method: 'DELETE' });
export const createWritingMediaEmbed = (accessToken: string, body: Pick<WritingMediaEmbed, 'media_asset' | 'position_hint' | 'writing'> & Partial<Pick<WritingMediaEmbed, 'alt_text_override' | 'caption_override'>>) =>
  portalRequest<WritingMediaEmbed>('/v1/writing-media-embeds/', { accessToken, body, method: 'POST' });
export const updateWritingMediaEmbed = (accessToken: string, id: number | string, body: Partial<Pick<WritingMediaEmbed, 'alt_text_override' | 'caption_override' | 'position_hint'>>) =>
  portalRequest<WritingMediaEmbed>(`/v1/writing-media-embeds/${id}/`, { accessToken, body, method: 'PATCH' });

export const deleteWritingMediaEmbed = (accessToken: string, id: number | string) =>
  portalRequest<null>(`/v1/writing-media-embeds/${id}/`, { accessToken, method: 'DELETE' });
export const fetchWritingScriptureReferences = async (accessToken: string, writingId: string | number, signal?: AbortSignal) =>
  normalizePage<WritingScriptureReference>(await portalRequest<unknown>(`/v1/writing-scripture-references/?writing=${encodeURIComponent(String(writingId))}`, { accessToken, signal }));

export const createWritingScriptureReference = (accessToken: string, body: WritingScriptureReferenceCreatePayload) =>
  portalRequest<WritingScriptureReference>('/v1/writing-scripture-references/', { accessToken, body, method: 'POST' });

export const updateWritingScriptureReference = (accessToken: string, id: string | number, body: Partial<WritingScriptureReferencePayload>) =>
  portalRequest<WritingScriptureReference>(`/v1/writing-scripture-references/${id}/`, { accessToken, body, method: 'PATCH' });

export const deleteWritingScriptureReference = (accessToken: string, id: string | number) =>
  portalRequest<null>(`/v1/writing-scripture-references/${id}/`, { accessToken, method: 'DELETE' });
export const fetchMediaAssetUsage = (accessToken: string, id: string | number, signal?: AbortSignal) =>
  portalRequest<MediaAssetUsage>(`/v1/media-assets/${id}/usage/`, { accessToken, signal });

export const fetchWorkflowNotes = async (accessToken: string, writingId: string | number, signal?: AbortSignal) =>
  normalizePage<WritingWorkflowNote>(await portalRequest<unknown>(`/v1/writing-workflow-notes/?writing=${encodeURIComponent(String(writingId))}`, { accessToken, signal }));

export const createWorkflowNote = (accessToken: string, body: WritingWorkflowNoteCreatePayload) =>
  portalRequest<WritingWorkflowNote>('/v1/writing-workflow-notes/', { accessToken, body, method: 'POST' });

export const updateWorkflowNote = (accessToken: string, id: string | number, body: WritingWorkflowNoteUpdatePayload) =>
  portalRequest<WritingWorkflowNote>(`/v1/writing-workflow-notes/${id}/`, { accessToken, body, method: 'PATCH' });

export const deleteWorkflowNote = (accessToken: string, id: string | number) =>
  portalRequest<null>(`/v1/writing-workflow-notes/${id}/`, { accessToken, method: 'DELETE' });
