import { initializeEntity } from '@mex/entity-utils';
import { taskTable } from '../service/DynamoDB';

export const TaskEntity = initializeEntity({
  name: 'task',
  table: taskTable,
  additionalAttributes: {
    status: {
      type: 'string',
    },
  },
});
