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

export default {
  post,
};
