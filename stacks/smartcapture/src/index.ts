import { handlerPath } from '../utils/handlerResolver';

const config = {
  handler: `${handlerPath(__dirname)}/handler.config`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/config',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'PATCH',
        path: '/config/{configId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/config/{configId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/config/all',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/config/all/{base}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/config/all/public',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: '/config/{configId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: '/config/{configId}/labels',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/variable/{variableId}/labels/all',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const main = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/variable',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/variables',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/variable/{variableId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: '/variable/{variableId}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

export default {
  main,
  config,
};
