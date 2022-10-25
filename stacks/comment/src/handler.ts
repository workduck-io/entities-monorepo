import { middyfy } from '@mex/middy-utils';
import {
  createGatewayLambdaHandler,
  createLambdaEventMapping,
  HTTPMethod,
} from '@workduck-io/lambda-routing';
import {
  createHandler,
  deleteAllEntitiesOfNodeHandler,
  deleteHandler,
  getAllEntitiesOfNodeHandler,
  getHandler,
} from './handlers/comments';

const routeHandlers = [
  {
    method: HTTPMethod.DELETE,
    path: '/all/{nodeId}',
    handler: deleteAllEntitiesOfNodeHandler,
  },

  {
    method: HTTPMethod.DELETE,
    path: '/all/{nodeId}/block/{blockId}',
    handler: deleteAllEntitiesOfNodeHandler,
  },

  {
    method: HTTPMethod.DELETE,
    path: '/all/{nodeId}/block/{blockId}/thread/{threadId}',
    handler: deleteAllEntitiesOfNodeHandler,
  },

  {
    method: HTTPMethod.GET,
    path: '/all/{nodeId}',
    handler: getAllEntitiesOfNodeHandler,
  },

  {
    method: HTTPMethod.GET,
    path: '/all/{nodeId}/block/{blockId}',
    handler: getAllEntitiesOfNodeHandler,
  },

  {
    method: HTTPMethod.GET,
    path: '/all/{nodeId}/block/{blockId}/thread/{threadId}',
    handler: getAllEntitiesOfNodeHandler,
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
];

const handlerPairs = createLambdaEventMapping(routeHandlers);

export const main = middyfy(createGatewayLambdaHandler(handlerPairs));
