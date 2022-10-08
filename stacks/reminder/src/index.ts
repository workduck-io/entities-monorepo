import { handlerPath } from '../utils/handlerResolver';

const post = {
  handler: `${handlerPath(__dirname)}/handler.create`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const get = {
  handler: `${handlerPath(__dirname)}/handler.get`,
  events: [
    {
      httpApi: {
        method: 'GET',
        path: '/{entityId}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const deleteAllEntitiesOfNode = {
  handler: `${handlerPath(__dirname)}/handler.deleteAllEntitiesOfNode`,
  events: [
    {
      httpApi: {
        method: 'DELETE',
        path: '/all/node/{nodeId}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const restoreAllEntitiesOfNode = {
  handler: `${handlerPath(__dirname)}/handler.restoreAllEntitiesOfNode`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/all/node/{nodeId}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const del = {
  handler: `${handlerPath(__dirname)}/handler.del`,
  events: [
    {
      httpApi: {
        method: 'DELETE',
        path: '/{entityId}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const getAllEntitiesOfWorkspace = {
  handler: `${handlerPath(__dirname)}/handler.getAllEntitiesOfWorkspace`,
  events: [
    {
      httpApi: {
        method: 'GET',
        path: '/all/workspace',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const getAllEntitiesOfNode = {
  handler: `${handlerPath(__dirname)}/handler.getAllEntitiesOfNode`,
  events: [
    {
      httpApi: {
        method: 'GET',
        path: '/all/node/{nodeId}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

export default {
  post,
  get,
  del,
  getAllEntitiesOfWorkspace,
  getAllEntitiesOfNode,
  deleteAllEntitiesOfNode,
  restoreAllEntitiesOfNode,
};
