import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Table } from 'dynamodb-toolbox';
import { getEndpoint, getRegion } from '../utils/helpers';

const DocumentClient = new DynamoDB.DocumentClient({
  service: new DynamoDB({
    endpoint: getEndpoint(),
    region: getRegion(),
  }),
});

export const gpt3PromptTable = new Table({
  // Specify table name (used by DynamoDB)
  name: `${process.env.SLS_STAGE}-entity-store`,
  // Define partition and sort keys
  partitionKey: 'pk',
  sortKey: 'sk',
  indexes: {
    'pk-ak-index': {
      partitionKey: 'pk',
      sortKey: 'ak',
    },
  },

  // Add the DocumentClient
  DocumentClient,
});
