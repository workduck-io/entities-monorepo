import {
  createGatewayLambdaHandler,
  createLambdaEventMapping,
  HTTPMethod,
} from '@mex/gen-utils';
import { createHandler } from './handlers/createHandler';
import { deleteAllEntitiesOfNodeHandler } from './handlers/deleteAllEntitiesOfNodeHandler';
import { deleteHandler } from './handlers/deleteHandler';
import { getAllEntitiesOfNodeHandler } from './handlers/getAllEntitiesOfNodeHandler';
import { getAllEntitiesOfWorkspaceHandler } from './handlers/getAllEntitiesOfWorkspaceHandler';
import { getHandler } from './handlers/getHandler';
import { restoreAllEntitiesOfNodeHandler } from './handlers/restoreAllEntitiesOfNodeHandler';

const routeHandlers = [
  {
    method: HTTPMethod.POST,
    path: '/',
    handler: createHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/{entityId}',
    handler: getHandler,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/all/node/{nodeId}',
    handler: deleteAllEntitiesOfNodeHandler,
  },
  {
    method: HTTPMethod.POST,
    path: '/all/node/{nodeId}',
    handler: restoreAllEntitiesOfNodeHandler,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/{entityId}',
    handler: deleteHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/all/workspace',
    handler: getAllEntitiesOfWorkspaceHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/all/node/{nodeId}',
    handler: getAllEntitiesOfNodeHandler,
  },
];

const handlerPairs = createLambdaEventMapping(routeHandlers);

export const main = createGatewayLambdaHandler(handlerPairs);
