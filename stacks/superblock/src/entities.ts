import { Entity } from 'dynamodb-toolbox';
import { superblockTable } from '../service/DynamoDB';

export const SuperblockEntity = new Entity({
  name: 'superblock',
  attributes: {
    name: {
      type: 'string',
      sortKey: true,
    },
    superblockId: {
      type: 'string',
      partitionKey: true,
    },
    config: {
      type: 'map',
      default: () => ({
        Bottom: [],
      }),
    },
  },
  table: superblockTable,
} as const);

export const SuperblockPropertyEntity = new Entity({
  name: 'superblockProperty',
  attributes: {
    propertyId: {
      type: 'string',
      partitionKey: true,
    },
    name: {
      type: 'string',
      sortKey: true,
    },
    status: {
      type: 'string',
      default: 'none',
    },
  },
  table: superblockTable,
  timestamps: false,
} as const);
