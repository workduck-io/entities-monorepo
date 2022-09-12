import { getAccess } from '@mex/access-checker';
import { BatchRequest, createBatchRequest } from '@mex/entity-utils';
import { createError } from '@middy/util';
import { taskTable } from '../service/DynamoDB';
import { ValidatedAPIGatewayProxyHandler } from '../utils/apiGateway';
import { extractWorkspaceId } from '../utils/helpers';
import { middyfy } from '../utils/middleware';
import { TaskEntity, ViewEntity } from './entities';
import { Task, View } from './interface';

const createHandler: ValidatedAPIGatewayProxyHandler<Task> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const task = event.body;
  if (task.workspaceId && workspaceId != task.workspaceId) {
    const access = await getAccess(workspaceId, task.nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
  }
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
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getHandler: ValidatedAPIGatewayProxyHandler<undefined> = async (
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
    throw createError(400, JSON.stringify(e.message));
  }
};

export const deleteHandler: ValidatedAPIGatewayProxyHandler<undefined> = async (
  event
) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const res = await TaskEntity.delete({
      workspaceId,
      entityId,
    });
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getAllEntitiesOfWorkspaceHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const res = (await TaskEntity.query(workspaceId)).Items;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getAllEntitiesOfNodeHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
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
    throw createError(400, JSON.stringify(e.message));
  }
};

const batchUpdateHandler: ValidatedAPIGatewayProxyHandler<
  BatchRequest<Task>
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const req = event.body;
    await Promise.all(
      [...new Set(req.map((r) => r.nodeId))].map(async (nodeId) => {
        const access = await getAccess(workspaceId, nodeId, event);
        if (access === 'NO_ACCESS' || access === 'READ')
          throw createError(401, 'User access denied');
      })
    );
    const batchRequest = createBatchRequest({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      associatedEntity: TaskEntity,
      workspaceId,
      request: req,
    });
    const result = await Promise.all(
      batchRequest.map(async (chunk) => await taskTable.batchWrite(chunk))
    );
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

const createViewHandler: ValidatedAPIGatewayProxyHandler<View> = async (
  event
) => {
  const workspaceId = extractWorkspaceId(event);
  const view = event.body;
  try {
    const res = (
      await ViewEntity.update(
        { ...view, workspaceId },
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
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getViewHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const res = (
      await ViewEntity.get({
        workspaceId,
        entityId,
      })
    ).Item;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const deleteViewHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const res = await ViewEntity.delete({
      workspaceId,
      entityId,
    });
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getAllViewsOfWorkspaceHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const res = (await ViewEntity.query(workspaceId)).Items;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const create = middyfy(createHandler);
export const get = middyfy(getHandler);
export const del = middyfy(deleteHandler);
export const getAllEntitiesOfWorkspace = middyfy(
  getAllEntitiesOfWorkspaceHandler
);
export const getAllEntitiesOfNode = middyfy(getAllEntitiesOfNodeHandler);
export const batchUpdate = middyfy(batchUpdateHandler);

export const createView = middyfy(createViewHandler);
export const getView = middyfy(getViewHandler);
export const delView = middyfy(deleteViewHandler);

export const getAllViewsOfWorkspace = middyfy(getAllViewsOfWorkspaceHandler);
