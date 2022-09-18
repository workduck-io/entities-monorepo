import { initializeEntity } from '@mex/entity-utils';
import { Entity } from 'dynamodb-toolbox';
import { reactionTable } from '../service/DynamoDB';

export const ReactionEntity = initializeEntity({
  name: 'reaction',
  additionalAttributes: {
    up: { type: 'number', default: () => 0 },
    down: { type: 'number', default: () => 0 },
  },
  table: reactionTable,
} as const);

export const ReactionItemEntity = new Entity({
  name: 'reactionItem',
  attributes: {
    blockId: { partitionKey: true },
    userId: { sortKey: true },
    nodeId: { type: 'string', required: true, map: 'ak' },
    reaction: { type: 'string' },
  },
  table: reactionTable,
} as const);
