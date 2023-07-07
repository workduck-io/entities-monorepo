import { Entity } from 'dynamodb-toolbox';
import { superblockTable } from '../service/DynamoDB';

export const SuperblockEntity = new Entity({
  name: 'superblock',
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    superblockId: {
      type: 'string',
      required: true,
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
    name: {
      type: 'string',
      required: true,
    },
    status: {
      type: 'string',
      enum: ['todo', 'inprogress', 'done'],
      default: 'none',
    },
    propertyId: {
      type: 'string',
      required: true,
    },
  },
  table: superblockTable,
  timestamps: false,
} as const);

