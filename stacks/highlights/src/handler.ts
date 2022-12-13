import { middyfy } from '@mex/middy-utils';
import {
  createGatewayLambdaHandler,
  createLambdaEventMapping,
  HTTPMethod,
} from '@workduck-io/lambda-routing';
import {
  createHandler,
  deleteAllEntitiesOfURLHandler,
  deleteHandler,
  getAllEntitiesOfURLHandler,
  getAllEntitiesOfWorkspaceHandler,
  getHandler,
  getMultipleHandler,
} from './handlers/highlights';

const routeHandlers = [
  {
    method: HTTPMethod.DELETE,
    path: '/all/{urlHash}',
    handler: deleteAllEntitiesOfURLHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/all/{urlHash}',
    handler: getAllEntitiesOfURLHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/all',
    handler: getAllEntitiesOfWorkspaceHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/{entityId}',
    handler: getHandler,
  },

  {
    method: HTTPMethod.DELETE,
    path: '/{entityId}',
    handler: deleteHandler,
  },

  {
    method: HTTPMethod.POST,
    path: '/',
    handler: createHandler,
  },

  {
    method: HTTPMethod.POST,
    path: '/multiple',
    handler: getMultipleHandler,
  },
];

const handlerPairs = createLambdaEventMapping(routeHandlers);

export const main = middyfy(createGatewayLambdaHandler(handlerPairs));
