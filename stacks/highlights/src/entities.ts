import { defaultEntityAttributes } from '@mex/entity-utils';
import { Entity } from 'dynamodb-toolbox';
import { highlightsTable } from '../service/DynamoDB';

export const HighlightsEntity = new Entity({
  name: 'highlights',
  attributes: {
    ...defaultEntityAttributes,
    nodeId: { type: 'string' },
    urlHash: { map: 'ak', type: 'string', prefix: 'URL_', required: true },
  },
  table: highlightsTable,
} as const);
