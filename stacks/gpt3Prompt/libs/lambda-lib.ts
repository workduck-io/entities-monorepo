import { Lambda } from '@workduck-io/invoke-lambda';
import LambdaClient from 'aws-sdk/clients/lambda';

const lambdaClient = new LambdaClient({
  region: 'us-east-1',
});

export const lambda = new Lambda(lambdaClient as any);
