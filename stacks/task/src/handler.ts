import { middyfy } from '@mex/middy-utils';
import {
  createGatewayLambdaHandler,
  createLambdaEventMapping,
  HTTPMethod,
} from '@workduck-io/lambda-routing';
import {
  batchUpdateHandler,
  createHandler,
  deleteAllEntitiesOfNodeHandler,
  deleteHandler,
  getAllEntitiesOfNodeHandler,
  getAllEntitiesOfWorkspaceHandler,
  getEntityOfMultipleNodesHandler,
  getHandler,
  restoreAllEntitiesOfNodeHandler,
} from './handlers/tasks';
import {
  createViewHandler,
  deleteViewHandler,
  getAllViewsOfWorkspaceHandler,
  getViewHandler,
} from './handlers/view';

const taskRouteHandlers = [
  {
    method: HTTPMethod.POST,
    path: '/',
    handler: createHandler,
  },
  {
    method: HTTPMethod.POST,
    path: '/batch/update',
    handler: batchUpdateHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/{entityId}',
    handler: getHandler,
  },
  {
    method: HTTPMethod.POST,
    path: '/batch/get',
    handler: getEntityOfMultipleNodesHandler,
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

const viewRouteHandlers = [
  {
    method: HTTPMethod.POST,
    path: '/view',
    handler: createViewHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/view/{entityId}',
    handler: getViewHandler,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/view/{entityId}',
    handler: deleteViewHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/view/all/workspace',
    handler: getAllViewsOfWorkspaceHandler,
  },
];

const taskHandlerPairs = createLambdaEventMapping(taskRouteHandlers);
const viewHandlerPairs = createLambdaEventMapping(viewRouteHandlers);

export const task = middyfy(createGatewayLambdaHandler(taskHandlerPairs));
export const view = middyfy(createGatewayLambdaHandler(viewHandlerPairs));
