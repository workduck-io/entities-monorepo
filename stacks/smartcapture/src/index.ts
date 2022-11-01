import { handlerPath } from '../utils/handlerResolver';

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
        method: 'POST',
        path: '/label',
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
        path: '/labels',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/label/{labelId}',
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
        path: '/label/{labelId}',
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
};
