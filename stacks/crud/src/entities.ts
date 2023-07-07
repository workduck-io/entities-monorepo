import { Entity } from 'dynamodb-toolbox';
import { crudTable } from '../service/DynamoDB';

export const CrudEntity = new Entity({
  name: 'crud',
  attributes: {
    id: { type: 'string', partitionKey: true },
    name: { type: 'string', sortKey: true },
    content: { type: 'string' },
  },
  table: crudTable,
  timestamps: false,
} as const);
