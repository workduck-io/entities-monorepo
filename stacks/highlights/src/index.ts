import { handlerPath } from '../utils/handlerResolver';

const main = {
  handler: `${handlerPath(__dirname)}/handler.main`,
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
        method: 'POST',
        path: '/multiple',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/{entityId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: '/{entityId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/all',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/all/{urlHash}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: '/all/{urlHash}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

export default {
  main,
};
