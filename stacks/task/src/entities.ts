import { defaultEntityAttributes } from '@mex/entity-utils';
import { Entity } from 'dynamodb-toolbox';
import { taskTable } from '../service/DynamoDB';

export const TaskEntity = new Entity({
  name: 'task',
  table: taskTable,
  attributes: {
    ...defaultEntityAttributes,
    blockId: {
      type: 'string',
    },
    content: { type: 'list' },
  },
});

export const ViewEntity = new Entity({
  name: 'view',
  table: taskTable,
  attributes: {
    ...defaultEntityAttributes,
    filters: {
      type: 'list',
    },
    namespace: {
      type: 'string',
    },
  },
});
