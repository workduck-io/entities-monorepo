import { createError } from '@middy/util';
import { MeiliSearch } from 'meilisearch';
import {
  MeiliSearchDocument,
  MeiliSearchDocumentResponse,
  MeiliSearchResponse,
} from '../src/interface';

export const meilisearchClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
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

// Search document from meilisearch
export const searchDocumentFromMeiliSearch = async (query: string) => {
  try {
    return (
      (await meilisearchClient.index('gpt3Prompt').search(query, {
        limit: 10000,
      })) as MeiliSearchResponse
    ).hits;
  } catch (e) {
    throw createError(400, 'Error searching document from meilisearch');
  }
};
