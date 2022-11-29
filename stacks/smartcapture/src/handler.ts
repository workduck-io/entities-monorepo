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
  getConfigHandler,
  updateConfigHandler,
} from './handlers/captureConfig';
import {
  createLabelHandler,
  createVariableHandler,
  deleteLabelHandler,
  deleteVariableHandler,
  getAllLabelsForWebpageHandler,
  getAllLabelsHandler,
  getAllVariablesHandler,
  getLabelHandler,
  getVariableHandler,
} from './handlers/smartcaptures';

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
    path: '/label',
    handler: createLabelHandler,
  },
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
    path: '/labels',
    handler: getAllLabelsHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/label/{labelId}',
    handler: getLabelHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/variable/{variableId}',
    handler: getVariableHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/labels/webpage/{webPage}',
    handler: getAllLabelsForWebpageHandler,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/label/{labelId}',
    handler: deleteLabelHandler,
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
