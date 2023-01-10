import { createError } from '@middy/util';
import { MeiliSearch } from 'meilisearch';
import {
  CATEGORIES,
  FilterKey,
  MeiliSearchDocument,
  MeiliSearchDocumentResponse,
  MeiliSearchResponse,
  SortKey,
  SortOrder,
} from '../src/interface';

export const meilisearchClient = new MeiliSearch({
  host:
    process.env.SLS_STAGE === 'local'
      ? process.env.MEILISEARCH_HOST_LOCAL
      : process.env.MEILISEARCH_HOST,
  apiKey:
    process.env.SLS_STAGE === 'local'
      ? process.env.MEILI_MASTER_KEY_LOCAL
      : process.env.MEILI_MASTER_KEY,
});

// Get all document from meilisearch
export const getAllDocuments = async (): Promise<MeiliSearchDocument[]> => {
  try {
    return (
      await meilisearchClient.index('gpt3Prompt').getDocuments({
        limit: 10000,
      })
    ).results as MeiliSearchDocument[];
  } catch (e) {
    throw createError(500, 'Error getting documents');
  }
};

// Add Document to mielisearch
export const addDocumentToMeiliSearch = async (
  document: MeiliSearchDocument
): Promise<MeiliSearchDocumentResponse> => {
  try {
    return (await meilisearchClient
      .index('gpt3Prompt')
      .addDocuments([document])) as MeiliSearchDocumentResponse;
  } catch (e) {
    throw createError(400, 'Error adding document to meilisearch');
  }
};

// Update document in meilisearch
export const updateDocumentInMeiliSearch = async (
  document: any
): Promise<MeiliSearchDocumentResponse> => {
  try {
    return (await meilisearchClient
      .index('gpt3Prompt')
      .updateDocuments([document])) as MeiliSearchDocumentResponse;
  } catch (e) {
    throw createError(400, 'Error updating document in meilisearch');
  }
};

// Delete document from meilisearch
export const deleteDocumentFromMeiliSearch = async (
  mid: string
): Promise<MeiliSearchDocumentResponse> => {
  try {
    return (await meilisearchClient
      .index('gpt3Prompt')
      .deleteDocument(mid)) as MeiliSearchDocumentResponse;
  } catch (e) {
    throw createError(400, 'Error deleting document from meilisearch');
  }
};

// Search, Filtering and sorting document from meilisearch
export const searchDocumentFromMeiliSearch = async (
  query?: string,
  filters?: { [key in FilterKey]: Array<CATEGORIES> },
  sort?: {
    [key in SortKey]: SortOrder;
  },
  limit?: number
) => {
  try {
    const filterString = filters
      ? Object.keys(filters).length > 0
        ? Object.keys(filters).filter((key) => filters[key].length > 0).length >
          0
          ? Object.keys(filters)
              .filter((key) => filters[key].length > 0)
              .map((key) => {
                return filters[key].map((value) => `${key} = ${value}`);
              })
              .flat()
              .join(' OR ')
          : ''
        : ''
      : '';

    const sortString = sort
      ? Object.keys(sort).length > 0
        ? [`${Object.keys(sort)[0]}:${Object.values(sort)[0]}`]
        : []
      : [];

    return (
      (await meilisearchClient.index('gpt3Prompt').search(query ? query : '', {
        limit: limit || 1000,
        filter: filterString || '',
        sort: sortString || [],
      })) as MeiliSearchResponse
    ).hits;
  } catch (e) {
    throw createError(400, 'Error searching document from meilisearch');
  }
};

export const sortFromMeiliSearch = async (
  sortkey: SortKey,
  sortOrder: SortOrder,
  filter?: string,
  limit?: number
) => {
  try {
    return (
      (await meilisearchClient.index('gpt3Prompt').search('', {
        sort: [`${sortkey}:${sortOrder}`],
        filter: filter || '',
        limit: limit || 1000,
      })) as MeiliSearchResponse
    ).hits;
  } catch (e) {
    throw createError(400, 'Error sorting document from meilisearch');
  }
};
