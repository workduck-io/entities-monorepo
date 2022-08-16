import { BatchRequest, createBatchRequest } from '@mex/entity-utils';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { taskTable } from '../service/DynamoDB';
import { ValidatedAPIGatewayProxyHandler } from '../utils/apiGateway';
import { extractWorkspaceId } from '../utils/helpers';
import { middyfy } from '../utils/middleware';
import { TaskEntity } from './entities';
import { Task } from './interface';
const createHandler: ValidatedAPIGatewayProxyHandler<Task> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const task = event.body;
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

export const get: ValidatedAPIGatewayProxyHandler<undefined> = async (
  event
) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
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
  try {
    const workspaceId = extractWorkspaceId(event);
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

export const getAllEntitiesOfNode: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const res = (
      await TaskEntity.query(nodeId, {
        index: 'ak-pk-index',
        eq: workspaceId,
      })
    ).Items;
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

const batchUpdateHandler: ValidatedAPIGatewayProxyHandler<
  BatchRequest<Task>
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const req = event.body;
    const batchRequest = createBatchRequest({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      associatedEntity: TaskEntity,
      workspaceId,
      request: req,
    });
    const result = await taskTable.batchWrite(batchRequest);
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

export const create = middyfy(createHandler);

export const batchUpdate = middyfy(batchUpdateHandler);