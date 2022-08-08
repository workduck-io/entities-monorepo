import { handlerPath } from '../utils/handlerResolver';

const post = {
  handler: `${handlerPath(__dirname)}/handler.create`,
  events: [
    {
      httpApi: {
        method: 'POST',
        path: '/',
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
        path: '/batch',
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
      },
    },
  ],
};

const getAllEntitiesOfNote = {
  handler: `${handlerPath(__dirname)}/handler.getAllEntitiesOfNote`,
  events: [
    {
      httpApi: {
        method: 'GET',
        path: '/all/note/{noteId}',
      },
    },
  ],
};

export default {
  post,
  batchUpdate,
  get,
  getAllEntitiesOfWorkspace,
  getAllEntitiesOfNote,
};
