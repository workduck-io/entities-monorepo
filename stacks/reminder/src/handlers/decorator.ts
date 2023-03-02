import {
  getHeaderMetadata,
  getLambdaMetadata,
  getPathMetadata,
  getQueryMetadata,
} from '@workduck-io/lambda-routing';

export const RouteAndExec2: any = () => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    descriptor.value = async (...args: any[]) => {
      const {
        httpMethod,
        resource,
        routeKey: rKey,
        headers,
        pathParameters,
        queryStringParameters,
      } = args[0];
      const routeKey = rKey ?? `${httpMethod} ${resource}`;
      const lambda = getLambdaMetadata(target)[routeKey];
      const method = Reflect.getOwnPropertyDescriptor(target, lambda.key);

      if (!method) throw new Error(`${routeKey} not found`);

      const headerAnnotatedParams = getHeaderMetadata(target, lambda.key);

      const pathAnnotatedParams = getPathMetadata(target, lambda.key);

      const queryAnnotatedParams = getQueryMetadata(target, lambda.key);

      if (headerAnnotatedParams)
        Object.keys(headerAnnotatedParams).forEach((param) => {
          const index = headerAnnotatedParams[param];
          args[index] = headers;
        });
      if (pathAnnotatedParams)
        Object.keys(pathAnnotatedParams).forEach((param) => {
          const index = pathAnnotatedParams[param];
          args[index] = pathParameters;
        });
      if (queryAnnotatedParams)
        Object.keys(queryAnnotatedParams).forEach((param) => {
          const index = queryAnnotatedParams[param];
          args[index] = queryStringParameters;
        });
      return await method.value(...args);
    };
  };
};
