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
        method: 'GET',
        path: '/all',
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
        method: 'PUT',
        path: '/',
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
    {
      httpApi: {
        method: 'PUT',
        path: '/download/{id}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'POST',
        path: '/result/{id}',
        timeout: 15,
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/allUser',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/allPublicUser',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/analytics/{promptId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'POST',
        path: '/search',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'POST',
        path: '/extra/{id}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/allCategories',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/home',
      },
    },
    {
      httpApi: {
        method: 'POST',
        path: '/userAuth',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/userAuth',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/providers',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

export default {
  main,
};
