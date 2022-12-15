import { middyfy } from '@mex/middy-utils';
import {
  createGatewayLambdaHandler,
  createLambdaEventMapping,
  HTTPMethod,
} from '@workduck-io/lambda-routing';
import {
  createPromptHandler,
  deletePromptHandler,
  downloadPromptHandler,
  getAllPromptsHandler,
  getAllPublicUserPromptsHandler,
  getAllUserPromptsHandler,
  getCategoriesHandler,
  getPromptAnalyticsHandler,
  getPromptHandler,
  homeDashboardHandler,
  likedViewedPromptHandler,
  resultPrompthandler,
  searchPromptHandler,
  sortPromptsHandler,
  updatePromptHandler,
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
    path: '/prompt',
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
    path: '/allPublicUserPrompts',
    handler: getAllPublicUserPromptsHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/sortPrompts',
    handler: sortPromptsHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/analytics/{promptId}',
    handler: getPromptAnalyticsHandler,
  },
  {
    method: HTTPMethod.POST,
    path: '/search',
    handler: searchPromptHandler,
  },
  {
    method: HTTPMethod.POST,
    path: '/extra/{id}',
    handler: likedViewedPromptHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/allCategories',
    handler: getCategoriesHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/home',
    handler: homeDashboardHandler,
  },
];

const handlerPairs = createLambdaEventMapping(routeHandlers);

export const main = middyfy(createGatewayLambdaHandler(handlerPairs));
