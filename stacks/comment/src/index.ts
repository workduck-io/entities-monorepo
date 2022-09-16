import { handlerPath } from '../utils/handlerResolver';

export const hello = {
  handler: `${handlerPath(__dirname)}/handler.hello`,
  events: [
    {
      httpApi: {
        method: 'GET',
        path: '/hello',
      },
    },
  ],
};
