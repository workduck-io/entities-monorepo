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

const variable = {
  handler: `${handlerPath(__dirname)}/handler.variable`,
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

const capture = {
  handler: `${handlerPath(__dirname)}/handler.capture`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/capture',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: '/capture/{captureId}',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/capture/{captureId}',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/usercaptures',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/workspacecaptures',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/config/{configId}/all',
      },
    },
  ],
};

export default {
  config,
  variable,
  capture,
};
