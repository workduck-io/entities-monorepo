import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { taskTable } from '../service/DynamoDB';
import { extractWorkspaceId } from '../utils/helpers';
import { TaskEntity } from './entities';

export const hello: APIGatewayProxyHandlerV2 = async (event, _context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message:
          'Go Serverless (Typescript) v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };
};

export const create: APIGatewayProxyHandlerV2 = async (event) => {
  const task = JSON.parse(event.body);
  const workspaceId = extractWorkspaceId(event);
  try {
    const res = (
      await TaskEntity.update(
        { ...task, workspaceId },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify(e),
    };
  }
};

export const get: APIGatewayProxyHandlerV2 = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const entityId = event.pathParameters.entityId;
  try {
    const res = (
      await TaskEntity.get({
        workspaceId,
        entityId,
      })
    ).Item;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify(e),
    };
  }
};

export const getAllEntitiesOfWorkspace: APIGatewayProxyHandlerV2 = async (
  event
) => {
  const workspaceId = extractWorkspaceId(event);
  try {
    const res = (await TaskEntity.query(workspaceId)).Items;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify(e),
    };
  }
};

export const getAllEntitiesOfNote: APIGatewayProxyHandlerV2 = async (event) => {
  const noteId = event.pathParameters.noteId;
  const workspaceId = extractWorkspaceId(event);
  try {
    const res = (
      await TaskEntity.query(noteId, {
        index: 'ak-pk-index',
        eq: workspaceId,
      })
    ).Items;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    console.log(e);

    return {
      statusCode: 400,
      body: JSON.stringify(e),
    };
  }
};

export const batchUpdate: APIGatewayProxyHandlerV2 = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const req = JSON.parse(event.body);
  try {
    const batchReq = req.map((r) => {
      if (r.type === 'UPDATE') {
        return TaskEntity.putBatch({
          ...r.data,
          workspaceId,
        });
      }
      if (r.type === 'DELETE') {
        return TaskEntity.deleteBatch({ ...r.data, workspaceId });
      }
    });
    const result = await taskTable.batchWrite(batchReq);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify(e),
    };
  }
};
