import { defaultEntityAttributes } from '@mex/entity-utils';
import { Entity } from 'dynamodb-toolbox';
import { highlightsTable } from '../service/DynamoDB';

export const HighlightsEntity = new Entity({
  name: 'highlights',
  attributes: {
    ...defaultEntityAttributes,
    nodeId: { type: 'string' },
    sourceUrl: { map: 'ak', type: 'string', prefix: 'URL_', required: true },
    createdAt: { type: 'number', required: true },
  },
  table: highlightsTable,
  timestamps: false,
} as const);
