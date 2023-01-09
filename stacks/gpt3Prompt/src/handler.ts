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
  getAllPromptsProviderHandler,
  getAllPublicUserPromptsHandler,
  getAllUserPromptsHandler,
  getPromptHandler,
  resultPrompthandler,
  updatePromptHandler,
} from './handlers/promptHandler';

import {
  getPromptAnalyticsHandler,
  likedViewedPromptHandler,
  homeDashboardHandler,
  getCategoriesHandler,
  searchPromptHandler,
} from './handlers/promptAnalyticsHandler';

import {
  createUserAuthHandler,
  getUserAuthHandler,
} from './handlers/promptUserHandler';

const routeHandlers = [
  {
    method: HTTPMethod.POST,
    path: '/',
    handler: createPromptHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/all',
    handler: getAllPromptsHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/allUser',
    handler: getAllUserPromptsHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/allPublicUser',
    handler: getAllPublicUserPromptsHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/{id}',
    handler: getPromptHandler,
  },
  {
    method: HTTPMethod.PUT,
    path: '/',
    handler: updatePromptHandler,
  },
  {
    method: HTTPMethod.DELETE,
    path: '/{id}',
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
  {
    method: HTTPMethod.POST,
    path: '/userAuth',
    handler: createUserAuthHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/userAuth',
    handler: getUserAuthHandler,
  },
  {
    method: HTTPMethod.GET,
    path: '/providers',
    handler: getAllPromptsProviderHandler,
  },
];

const handlerPairs = createLambdaEventMapping(routeHandlers);

export const main = middyfy(createGatewayLambdaHandler(handlerPairs));
