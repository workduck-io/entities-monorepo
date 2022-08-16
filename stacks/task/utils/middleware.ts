// import core
import middy from '@middy/core';
import { createError } from '@middy/util';
import { wdRequestIdParser } from '@workduck-io/wd-request-id-parser';

// import some middlewares
import httpCors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { validate } from '@workduck-io/workspace-validator';

const workduckWorkspaceValidatorMiddleware = () => {
  const workduckWorkspaceValidatorMiddlewareBefore = async (request) => {
    try {
      if (process.env.SLS_STAGE !== 'local' && !validate(request.event))
        throw new Error('Workspace dont match');
    } catch (cause) {
      const error = createError(401, 'Not authorized to the resource');
      error.cause = cause;
      throw error;
    }
  };

  return {
    before: workduckWorkspaceValidatorMiddlewareBefore,
  };
};

const userAccessValidatorMiddleware = () => {
  const userAccessValidatorMiddlewareBefore = async (request) => {
    try {
      if (!request)
        //TODO: Check if user has access to note
        throw new Error('User doesnt have access to resource');
    } catch (cause) {
      const error = createError(401, 'Not authorized to the resource');
      error.cause = cause;
      throw error;
    }
  };

  return {
    before: userAccessValidatorMiddlewareBefore,
  };
};

export const middyfy = (handler) => {
  return middy()
    .use(httpCors())
    .use(jsonBodyParser()) // parses the request body when it's a JSON and converts it to an object
    .use(wdRequestIdParser())
    .use(workduckWorkspaceValidatorMiddleware())
    .use(userAccessValidatorMiddleware())
    .use(
      httpErrorHandler({
        fallbackMessage: 'Server failed to respond',
      })
    ) // handles common http errors and returns proper responses
    .handler(handler);
};
