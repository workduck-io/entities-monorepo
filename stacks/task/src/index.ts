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

const batchUpdate = {
  handler: `${handlerPath(__dirname)}/handler.batchUpdate`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/batch/update',
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

const getEntityOfMultipleNodes = {
  handler: `${handlerPath(__dirname)}/handler.getEntityOfMultipleNodes`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/batch/get',
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

const postView = {
  handler: `${handlerPath(__dirname)}/view/handler.create`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/view',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const getView = {
  handler: `${handlerPath(__dirname)}/view/handler.get`,
  events: [
    {
      httpApi: {
        method: 'GET',
        path: '/view/{entityId}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const delView = {
  handler: `${handlerPath(__dirname)}/view/handler.del`,
  events: [
    {
      httpApi: {
        method: 'DELETE',
        path: '/view/{entityId}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const getAllViewsOfWorkspace = {
  handler: `${handlerPath(__dirname)}/view/handler.getAllViewsOfWorkspace`,
  events: [
    {
      httpApi: {
        method: 'GET',
        path: '/view/all/workspace',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

export default {
  post,
  batchUpdate,
  get,
  getEntityOfMultipleNodes,
  del,
  getAllEntitiesOfWorkspace,
  getAllEntitiesOfNode,
  deleteAllEntitiesOfNode,
  restoreAllEntitiesOfNode,
  postView,
  getView,
  delView,
  getAllViewsOfWorkspace,
};
