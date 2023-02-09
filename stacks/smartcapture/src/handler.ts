import { middyfy } from '@mex/middy-utils';
import {
  createGatewayLambdaHandler,
  createLambdaEventMapping,
  HTTPMethod,
} from '@workduck-io/lambda-routing';
import {
  createConfigHandler,
  deleteConfigHandler,
  deleteLabelHandler as deleteConfigLabelHandler,
  getAllConfigOfBase,
  getAllConfigOfPublic,
  getAllConfigOfWorkspace,
  getConfigHandler,
  updateConfigHandler,
} from './handlers/captureConfig';
import {
  createVariableHandler,
  deleteVariableHandler,
  getAllVariablesHandler,
  getVariableHandler,
} from './handlers/captureVariable';

const configRouteHandlers = [
  {
    method: HTTPMethod.POST,
    path: '/config',
    handler: createConfigHandler,
  },
  {
    method: HTTPMethod.PATCH,
    path: '/config/{configId}',
    handler: updateConfigHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/config/{configId}',
    handler: getConfigHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/config/all',
    handler: getAllConfigOfWorkspace,
  },
  {
    method: HTTPMethod.GET,
    path: '/config/all/{base}',
    handler: getAllConfigOfBase,
  },
  {
    method: HTTPMethod.GET,
    path: '/config/all/public',
    handler: getAllConfigOfPublic,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/config/{configId}',
    handler: deleteConfigHandler,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/config/{configId}/labels',
    handler: deleteConfigLabelHandler,
  },
];
const routeHandlers = [
  {
    method: HTTPMethod.POST,
    path: '/variable',
    handler: createVariableHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/variables',
    handler: getAllVariablesHandler,
  },

  {
    method: HTTPMethod.GET,
    path: '/variable/{variableId}',
    handler: getVariableHandler,
  },

  {
    method: HTTPMethod.DELETE,
    path: '/variable/{variableId}',
    handler: deleteVariableHandler,
  },
];

const handlerPairs = createLambdaEventMapping(routeHandlers);
const configHandlerPairs = createLambdaEventMapping(configRouteHandlers);

export const main = middyfy(createGatewayLambdaHandler(handlerPairs));
export const config = middyfy(createGatewayLambdaHandler(configHandlerPairs));
