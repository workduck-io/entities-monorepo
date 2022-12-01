import { initializeEntity } from '@mex/entity-utils';
import { gpt3PromptTable } from '../service/DynamoDB';

export const Gpt3PromptEntity = initializeEntity({
  name: 'gpt3Prompt',
  additionalAttributes: {
    entityId: {
      sortKey: true,
      type: 'string',
      coerce: false,
      prefix: 'PROMPT_',
    },
    createdBy: { type: 'string', required: 'always', map: 'ak' },
    title: { type: 'string' },
    description: { type: 'string' },
    prompt: { type: 'string' },
    properties: { type: 'map' },
    category: { type: 'string' },
    isPublic: { type: 'boolean' },
    tags: { type: 'list' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    input: { type: 'map' },
    downloadedBy: { type: 'list' },
    imageUrls: { type: 'list' },
    views: { type: 'number' },
    likes: { type: 'number' },
    version: { type: 'number' },
  },
  table: gpt3PromptTable,
} as const);
