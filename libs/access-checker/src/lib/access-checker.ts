import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyEvent } from './apiGateway';
import { NodeLambdaFunctionName } from './consts';
import { lambda } from './invokeLambda';

export const checkAccess = async (
  workspaceId: string,
  nodeId: string,
  event: ValidatedAPIGatewayProxyEvent<any>
) => {
  const response = await lambda.invokeAndCheck(
    NodeLambdaFunctionName,
    'RequestResponse',
    {
      routeKey: 'GET /shared/node/{id}/access',
      headers: {
        'mex-workspace-id': workspaceId,
        authorization: event.headers.authorization,
      },
      pathParameters: { id: nodeId },
    }
  );
  if (response === 'NO_ACCESS' || response === 'READ')
    throw createError(401, 'User access denied');
};
