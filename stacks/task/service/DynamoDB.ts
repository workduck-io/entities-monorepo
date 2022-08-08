import { DynamoDB } from 'aws-sdk';
import { Table } from 'dynamodb-toolbox';
import { getEndpoint, getRegion } from '../utils/consts';

export const DocumentClient = new DynamoDB.DocumentClient({
  service: new DynamoDB({
    endpoint: getEndpoint(),
    region: getRegion(),
  }),
});

export const taskTable = new Table({
  // Specify table name (used by DynamoDB)
  name: `${process.env.SLS_STAGE}-task-store`,

  // Define partition and sort keys
  partitionKey: 'pk',
  sortKey: 'sk',
  indexes: {
    'ak-pk-index': {
      partitionKey: 'ak',
      sortKey: 'pk',
    },
    'reverse-index': {
      partitionKey: 'sk',
      sortKey: 'ak',
    },
  },

  // Add the DocumentClient
  DocumentClient,
});
