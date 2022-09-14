import { getAccess } from '@mex/access-checker';
import { BatchUpdateRequest, createBatchRequest } from '@mex/entity-utils';
import { createError } from '@middy/util';
import { taskTable } from '../service/DynamoDB';
import { ValidatedAPIGatewayProxyHandler } from '../utils/apiGateway';
import { MAX_DYNAMO_BATCH_REQUEST } from '../utils/consts';
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
        { ...task, workspaceId, source: 'EXTERNAL' },
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
  const lastKey = event.queryStringParameters.lastKey;
  try {
    const workspaceId = extractWorkspaceId(event);
    const res = await TaskEntity.query(workspaceId, {
      startKey: {
        pk: workspaceId,
        sk: lastKey,
      },
    });
    return {
      statusCode: 200,
      body: JSON.stringify({
        Items: res.Items,
        lastKey: res.LastEvaluatedKey?.sk ?? undefined,
      }),
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

const getEntityOfMultipleNodesHandler: ValidatedAPIGatewayProxyHandler<{
  nodes: string[];
}> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const req = event.body;
  const dedupNodeList = [...new Set(req.nodes)];
  if (dedupNodeList.length > MAX_DYNAMO_BATCH_REQUEST)
    throw createError(
      400,
      `Maximum ${MAX_DYNAMO_BATCH_REQUEST} can be requested at once`
    );
  const successful = [];
  const failed = [];
  await Promise.all(
    dedupNodeList.map(async (nodeId) => {
      const access = await getAccess(workspaceId, nodeId, event);
      if (access === 'NO_ACCESS') {
        failed.push({ nodeId, reason: 'No access' });
      } else {
        const res = (
          await TaskEntity.query(nodeId, {
            index: 'ak-pk-index',
            eq: workspaceId,
          })
        ).Items;
        successful.push({ [nodeId]: res });
      }
    })
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ Items: successful, Failed: failed }),
  };
};

const batchUpdateHandler: ValidatedAPIGatewayProxyHandler<
  BatchUpdateRequest<Task>
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
      source: 'NOTE',
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
export const getEntityOfMultipleNodes = middyfy(
  getEntityOfMultipleNodesHandler
);

export const createView = middyfy(createViewHandler);
export const getView = middyfy(getViewHandler);
export const delView = middyfy(deleteViewHandler);

export const getAllViewsOfWorkspace = middyfy(getAllViewsOfWorkspaceHandler);
