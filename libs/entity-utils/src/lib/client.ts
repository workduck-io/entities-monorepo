import DynamoDB from 'aws-sdk/clients/dynamodb';
import { getEndpoint, getRegion } from './utils';

export const DocumentClient = new DynamoDB.DocumentClient({
  service: new DynamoDB({
    endpoint: getEndpoint(),
    region: getRegion(),
  }),
});
