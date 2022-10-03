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

const getAllEntitiesOfNode = {
  handler: `${handlerPath(__dirname)}/handler.getAllEntitiesOfNode`,
  events: [
    {
      httpApi: {
        method: 'GET',
        path: 'all/{nodeId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: 'all/{nodeId}/block/{blockId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: 'all/{nodeId}/block/{blockId}/thread/{threadId}',
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
        path: 'all/{nodeId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: 'all/{nodeId}/block/{blockId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'DELETE',
        path: 'all/{nodeId}/block/{blockId}/thread/{threadId}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

export default {
  post,
  del,
  get,
  getAllEntitiesOfNode,
  deleteAllEntitiesOfNode,
};
