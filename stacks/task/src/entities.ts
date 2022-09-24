import { initializeEntity } from '@mex/entity-utils';
import { taskTable } from '../service/DynamoDB';

export const TaskEntity = initializeEntity({
  name: 'task',
  table: taskTable,
  additionalAttributes: {
    blockId: {
      type: 'string',
      required: 'always',
    },
    content: { type: 'list' },
  },
});

export const ViewEntity = initializeEntity({
  name: 'view',
  table: taskTable,
  additionalAttributes: {
    filters: {
      type: 'list',
    },
    namespace: {
      type: 'string',
    },
    content: { type: 'list' },
  },
});
