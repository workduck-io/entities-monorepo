import { handlerPath } from '../utils/handlerResolver';

const task = {
  handler: `${handlerPath(__dirname)}/handler.task`,
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
        path: '/batch/update',
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
        method: 'POST',
        path: '/batch/get',
        authorizer: 'workduckAuthorizer',
      },
    },

    {
      httpApi: {
        method: 'DELETE',
        path: '/all/node/{nodeId}',
        authorizer: 'workduckAuthorizer',
      },
    },

    {
      httpApi: {
        method: 'POST',
        path: '/all/node/{nodeId}',
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
        path: '/all/workspace',
        authorizer: 'workduckAuthorizer',
      },
    },

    {
      httpApi: {
        method: 'GET',
        path: '/all/node/{nodeId}',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

const view = {
  handler: `${handlerPath(__dirname)}/handler.view`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/view',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/view/{entityId}',
        authorizer: 'workduckAuthorizer',
      },
    },

    {
      httpApi: {
        method: 'DELETE',
        path: '/view/{entityId}',
        authorizer: 'workduckAuthorizer',
      },
    },

    {
      httpApi: {
        method: 'GET',
        path: '/view/all/workspace',
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
  task,
  view,
};
