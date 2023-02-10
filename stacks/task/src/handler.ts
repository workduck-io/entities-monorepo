import { middyfy } from '@mex/middy-utils';
import {
  createGatewayLambdaHandler,
  createLambdaEventMapping,
  HTTPMethod,
} from '@workduck-io/lambda-routing';
import { taskHandler } from './handlers/tasks';
import { viewHandler } from './handlers/view';

const taskRouteHandlers = [
  {
    method: HTTPMethod.POST,
    path: '/',
    handler: taskHandler.createHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/{entityId}',
    handler: taskHandler.getHandler,
  },
  {
    method: HTTPMethod.POST,
    path: '/batch/update',
    handler: taskHandler.batchUpdateHandler,
  },
  {
    method: HTTPMethod.POST,
    path: '/batch/get',
    handler: taskHandler.getEntityOfMultipleNodesHandler,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/all/node/{nodeId}',
    handler: taskHandler.deleteAllEntitiesOfNodeHandler,
  },
  {
    method: HTTPMethod.POST,
    path: '/all/node/{nodeId}',
    handler: taskHandler.restoreAllEntitiesOfNodeHandler,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/{entityId}',
    handler: taskHandler.deleteHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/all/workspace',
    handler: taskHandler.getAllEntitiesOfWorkspaceHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/all/node/{nodeId}',
    handler: taskHandler.getAllEntitiesOfNodeHandler,
  },
];

const viewRouteHandlers = [
  {
    method: HTTPMethod.POST,
    path: '/view',
    handler: viewHandler.createViewHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/view/{entityId}',
    handler: viewHandler.getViewHandler,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/view/{entityId}',
    handler: viewHandler.deleteViewHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/view/all/workspace',
    handler: viewHandler.getAllViewsOfWorkspaceHandler,
  },
];

const taskHandlerPairs = createLambdaEventMapping(taskRouteHandlers);
const viewHandlerPairs = createLambdaEventMapping(viewRouteHandlers);

export const task = middyfy(createGatewayLambdaHandler(taskHandlerPairs));
export const view = middyfy(createGatewayLambdaHandler(viewHandlerPairs));
