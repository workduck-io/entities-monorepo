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

const getReactionsOfNode = {
  handler: `${handlerPath(__dirname)}/handler.getReactionsOfNode`,
  events: [
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
  ],
};

const getDetailedReactionForBlock = {
  handler: `${handlerPath(__dirname)}/handler.getDetailedReactionForBlock`,
  events: [
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
  post,
  getReactionsOfNode,
  getDetailedReactionForBlock,
};
