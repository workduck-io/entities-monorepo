import { DocumentClient } from '@mex/entity-utils';
import { Table } from 'dynamodb-toolbox';

export const reactionTable = new Table({
  // Specify table name (used by DynamoDB)
  name: `${process.env.SLS_STAGE}-reaction-store`,
  // Define partition and sort keys
  partitionKey: 'pk',
  sortKey: 'sk',
  // Add the DocumentClient
  DocumentClient,
});
