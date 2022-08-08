import { APIGatewayProxyEventV2 } from 'aws-lambda';

export const extractWorkspaceId = (event: APIGatewayProxyEventV2) => {
  return event.headers['mex-workspace-id'];
};
