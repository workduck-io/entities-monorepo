import { Entity } from 'dynamodb-toolbox';
import { superblockTable } from '../service/DynamoDB';

export const SuperblockEntity = new Entity({
  name: 'superblock',
  attributes: {
    workspaceId: {
      type: 'string',
      partitionKey: true,
    },
    superblockId: {
      type: 'string',
      sortKey: true,
    },
    name: {
      type: 'string',
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
    workspaceId: {
      type: 'string',
      partitionKey: true,
    },
    propertyId: {
      type: 'string',
      sortKey: true,
    },
    name: {
      type: 'string',
    },
    status: {
      type: 'string',
      default: 'none',
    },
    superblockId: {
      type: 'string',
    },
  },
  table: superblockTable,
  timestamps: false,
} as const);
