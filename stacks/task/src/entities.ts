import { Entity } from 'dynamodb-toolbox';
import { nanoid } from 'nanoid';
import { taskTable } from '../service/DynamoDB';

export const TaskEntity = new Entity({
  name: 'task',
  attributes: {
    workspaceId: { partitionKey: true, type: 'string' },
    entityId: {
      sortKey: true,
      type: 'string',
      default: () => `TASK_${nanoid()}`,
    },
    noteId: { type: 'string', required: true, map: 'ak' },
    properties: { type: 'map' },
  },
  table: taskTable,
} as const);
