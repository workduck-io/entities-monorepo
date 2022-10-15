import { middyfy } from '@mex/middy-utils';
import {
  EventHandlerMap,
  EventHandlerPairs,
  HTTPMethod,
  ValidatedAPIGatewayProxyHandler,
} from './interfaces';

export const createRouteKey = (method: HTTPMethod, path: string) => {
  return `${method} ${path}`;
};

export const createLambdaEventMapping = (
  eventFunctionPairs: EventHandlerMap[]
): EventHandlerPairs => {
  const handlerPairs: EventHandlerPairs = {};
  eventFunctionPairs.forEach((efp) => {
    handlerPairs[createRouteKey(efp.method, efp.path)] = efp.handler;
  });
  return handlerPairs;
};

export const createGatewayLambdaHandler = (mapper: EventHandlerPairs) => {
  const handler: ValidatedAPIGatewayProxyHandler<any> = (
    event,
    context,
    callback
  ) => {
    const route = event.routeKey;
    return mapper[route](event, context, callback);
  };
  return middyfy(handler);
};

export const createLambdaHandler = (func: (event) => unknown) => {
  const handler = (event) => {
    return func(event);
  };
  return handler;
};
