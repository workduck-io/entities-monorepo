import { handlerPath } from '../utils/handlerResolver';

const property = {
  handler: `${handlerPath(__dirname)}/handler.create`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/{id}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'PATCH',
        path: '/{id}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: '/{id}',
        authorizer: 'workduckAuthorizer',
      },
    },

  ],
};

export default {
  property,
};
