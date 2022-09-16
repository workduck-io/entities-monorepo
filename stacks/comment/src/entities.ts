import { initializeEntity } from '@mex/entity-utils';
import { commentTable } from '../service/DynamoDB';

export const CommentEntity = initializeEntity({
  name: 'comment',
  additionalAttributes: {
    blockId: { type: 'string', required: 'always' },
    content: { type: 'list' },
  },
  table: commentTable,
} as const);
