import { generateEntityId } from '@mex/gen-utils';
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
      default: generateEntityId('PROPERTY'),
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
    values: {
      type: 'list',
      default: [],
    },
    properties: {
      type: 'map',
    },
  },
  table: superblockTable,
  timestamps: false,
} as const);
