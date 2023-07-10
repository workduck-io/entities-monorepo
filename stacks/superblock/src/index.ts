import { handlerPath } from '../utils/handlerResolver';

const main = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/',
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
  main,
};
