import { defaultEntityAttributes } from '@mex/entity-utils';
import { Entity } from 'dynamodb-toolbox';
import { commentTable } from '../service/DynamoDB';

export const CommentEntity = new Entity({
  name: 'comment',
  attributes: {
    ...defaultEntityAttributes,
    nodeId: { partitionKey: true, coerce: false, type: 'string' },
    entityId: { sortKey: true, coerce: false, type: 'string' },
    blockId: {
      type: 'string',
      map: 'ak',
      coerce: false,
      transform: (value, data) => value + '#' + data.threadId ?? data.entityId,
    },
    threadId: { type: 'string', default: (data) => data.entityId },
    workspaceId: {
      type: 'string',
    },
    content: { type: 'list' },
    _source: { type: 'string', default: () => 'INTERNAL', hidden: true },
    _status: { type: 'string', default: () => 'ACTIVE', hidden: true },
    _ttl: { type: 'number', hidden: true },
    userId: { type: 'string', required: true },
    properties: { type: 'map' },
  },
  table: commentTable,
} as const);
