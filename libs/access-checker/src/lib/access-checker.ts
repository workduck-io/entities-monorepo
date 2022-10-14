import { ValidatedAPIGatewayProxyEvent } from '@mex/gen-utils';
import { NodeLambdaFunctionName } from './consts';
import { lambda } from './invokeLambda';

export const getAccess = async (
  workspaceId: string,
  nodeId: string,
  event: ValidatedAPIGatewayProxyEvent<any>
) => {
  if (process.env.SLS_STAGE === 'local') return 'MANAGE';
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
  return response;
};
