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
  handler: `${handlerPath(__dirname)}/handler.createView`,
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
  handler: `${handlerPath(__dirname)}/handler.getView`,
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
  handler: `${handlerPath(__dirname)}/handler.delView`,
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
  handler: `${handlerPath(__dirname)}/handler.getAllViewsOfWorkspace`,
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
  postView,
  getView,
  delView,
  getAllViewsOfWorkspace,
};
