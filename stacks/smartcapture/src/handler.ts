import { middyfy } from '@mex/middy-utils';
import {
  createGatewayLambdaHandler,
  createLambdaEventMapping,
  HTTPMethod,
} from '@workduck-io/lambda-routing';
import {
  createLabelHandler,
  createVariableHandler,
  deleteLabelHandler,
  deleteVariableHandler,
  getAllLabelsHandler,
  getAllVariablesHandler,
  getLabelHandler,
  getVariableHandler,
} from './handlers/smartcaptures';

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

export const main = middyfy(createGatewayLambdaHandler(handlerPairs));
