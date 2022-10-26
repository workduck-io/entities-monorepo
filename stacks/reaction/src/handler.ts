import { middyfy } from '@mex/middy-utils';
import {
  createGatewayLambdaHandler,
  createLambdaEventMapping,
  HTTPMethod,
} from '@workduck-io/lambda-routing';
import {
  createHandler,
  getAllReactionsOfNodeHandler,
  getDetailedReactionForBlockHandler,
} from './handlers/reaction';

const routeHandlers = [
  {
    method: HTTPMethod.GET,
    path: '/node/{nodeId}',
    handler: getAllReactionsOfNodeHandler,
  },

  {
    method: HTTPMethod.GET,
    path: '/node/{nodeId}/block/{blockId}',
    handler: getAllReactionsOfNodeHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/node/{nodeId}/block/{blockId}/details',
    handler: getDetailedReactionForBlockHandler,
  },

  {
    method: HTTPMethod.POST,
    path: '/',
    handler: createHandler,
  },
];

const handlerPairs = createLambdaEventMapping(routeHandlers);

export const main = middyfy(createGatewayLambdaHandler(handlerPairs));
