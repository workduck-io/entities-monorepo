import { middyfy } from '@mex/middy-utils';
import {
  createGatewayLambdaHandler,
  createLambdaEventMapping,
  HTTPMethod,
} from '@workduck-io/lambda-routing';
import {
  createPromptHandler,
  getPromptHandler,
  getAllPromptsHandler,
  updatePromptHandler,
  deletePromptHandler,
  downloadPromptHandler,
  resultPrompthandler,
  getAllUserPromptsHandler,
  sortPromptsHandler,
} from './handlers/promptHandler';

const routeHandlers = [
  {
    method: HTTPMethod.POST,
    path: '/prompt',
    handler: createPromptHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/allPrompts',
    handler: getAllPromptsHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/prompt/{id}',
    handler: getPromptHandler,
  },
  {
    method: HTTPMethod.PUT,
    path: '/prompt/{id}',
    handler: updatePromptHandler,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/prompt/{id}',
    handler: deletePromptHandler,
  },
  {
    method: HTTPMethod.PUT,
    path: '/download/{id}',
    handler: downloadPromptHandler,
  },
  {
    method: HTTPMethod.POST,
    path: '/result/{id}',
    handler: resultPrompthandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/allUserPrompts',
    handler: getAllUserPromptsHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/sortPrompts',
    handler: sortPromptsHandler,
  },
];

const handlerPairs = createLambdaEventMapping(routeHandlers);

export const main = middyfy(createGatewayLambdaHandler(handlerPairs));
