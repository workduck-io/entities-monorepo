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
        path: '/{propertyId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'PUT',
        path: '/{propertyId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: '/{propertyId}',
        authorizer: 'workduckAuthorizer',
      },
    },

  ],
};

const superblock = {
  handler: `${handlerPath(__dirname)}/handler.superblock`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/superblock',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/superblock/{superblockId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'PUT',
        path: '/superblock/{superblockId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: '/superblock/{superblockId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/superblock/{superblockId}/all',
        authorizer: 'workduckAuthorizer',
      },
    }
  ],
}

export default {
  main,
  superblock,
};
