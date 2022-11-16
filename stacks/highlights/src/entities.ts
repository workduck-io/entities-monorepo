import { initializeEntity } from '@mex/entity-utils';
import { highlightsTable } from '../service/DynamoDB';

export const HighlightsEntity = initializeEntity({
  name: 'highlights',
  additionalAttributes: {
    nodeId: { type: 'string' },
    urlHash: { map: 'ak', type: 'string', prefix: 'URL_', required: true },
  },
  table: highlightsTable,
} as const);
