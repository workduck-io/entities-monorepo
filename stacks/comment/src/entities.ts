import { initializeEntity } from '@mex/entity-utils';
import { commentTable } from '../service/DynamoDB';

export const CommentEntity = initializeEntity({
  name: 'comment',
  additionalAttributes: {
    nodeId: {
      type: 'string',
      map: 'ak',
      coerce: false,
      transform: (value, data) =>
        value + '#' + data.blockId + '#' + data.threadId ?? data.entityId,
    },
    blockId: { type: 'string', required: 'always' },
    threadId: { type: 'string', default: (data) => data.entityId },
    content: { type: 'list' },
  },
  table: commentTable,
} as const);
