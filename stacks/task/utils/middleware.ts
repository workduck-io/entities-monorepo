// import core
import middy from '@middy/core'; // esm Node v14+
//const middy = require('@middy/core') // commonjs Node v12+

// import some middlewares
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';

export const middyfy = (handler) => {
  return middy()
    .use(jsonBodyParser()) // parses the request body when it's a JSON and converts it to an object
    .use(
      httpErrorHandler({
        fallbackMessage: 'Server failed to respond',
      })
    ) // handles common http errors and returns proper responses
    .handler(handler);
};
