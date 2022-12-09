import { Entity } from 'dynamodb-toolbox';
import { gpt3PromptTable } from '../service/DynamoDB';

export const Gpt3PromptEntity = new Entity({
  name: 'gpt3Prompt',
  attributes: {
    workspaceId: { partitionKey: true, type: 'string' },
    entityId: {
      sortKey: true,
      type: 'string',
      coerce: false,
      prefix: 'PROMPT_',
    },
    userId: { type: 'string', required: true },
    createdBy: { type: 'string', required: 'always', map: 'ak' },
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    prompt: { type: 'string', required: true },
    properties: { type: 'map', required: true },
    category: { type: 'string', required: true },
    isPublic: { type: 'boolean', required: true },
    tags: { type: 'list', required: true },
    createdAt: { type: 'number', required: false },
    updatedAt: { type: 'number', required: false },
    downloadedBy: { type: 'list', required: true },
    imageUrls: { type: 'list', required: false },
    version: { type: 'number', default: () => 0, required: false },
    showcase: { type: 'list', required: false },
    analyticsId: { type: 'string', required: true },
  },
  timestamps: false,
  table: gpt3PromptTable,
} as const);

export const Gpt3PromptAnalyticsEntity = new Entity({
  name: 'gpt3PromptAnalytics',
  attributes: {
    promptId: {
      type: 'string',
      prefix: 'PROMPT_',
      partitionKey: true,
      coerce: false,
    },
    analyticsId: {
      sortKey: true,
      type: 'string',
      coerce: false,
      prefix: 'PROMPT_ANALYTICS_',
    },
    createdBy: {
      type: 'string',
      required: 'always',
      map: 'ak',
    },
    views: { type: 'list', required: true },
    likes: { type: 'list', required: true },
    downloadedBy: { type: 'list', required: true },
  },
  table: gpt3PromptTable,
  timestamps: false,
} as const);
