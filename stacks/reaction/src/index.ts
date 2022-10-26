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
        path: '/node/{nodeId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/node/{nodeId}/block/{blockId}',
        authorizer: 'workduckAuthorizer',
      },
    },
    {
      httpApi: {
        method: 'GET',
        path: '/node/{nodeId}/block/{blockId}/details',
        authorizer: 'workduckAuthorizer',
      },
    },
  ],
};

export default {
  main,
};
