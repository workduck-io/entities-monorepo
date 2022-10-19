import { getAccess } from '@mex/access-checker';
import {
  executeBatchRequest,
  itemFilter,
  MAX_DYNAMO_BATCH_REQUEST,
  type BatchUpdateRequest,
} from '@mex/entity-utils';
import { createError } from '@middy/util';

import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { TaskEntity } from '../entities';
import { Task } from '../interface';

export const createHandler: ValidatedAPIGatewayProxyHandler<Task> = async (
  event
) => {
  const workspaceId = extractWorkspaceId(event);
  const userId = extractUserIdFromToken(event);
  const task = event.body;
  if (task.workspaceId && workspaceId != task.workspaceId) {
    const access = await getAccess(workspaceId, task.nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
  }
  try {
    const res = (
      await TaskEntity.update(
        { ...task, workspaceId, userId, source: 'EXTERNAL', $remove: ['_ttl'] },
        {
          returnValues: 'UPDATED_NEW',
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
    if (!res) throw createError(404, 'Item not found');
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(e.statusCode ?? 400, JSON.stringify(e.message));
  }
};

export const deleteHandler: ValidatedAPIGatewayProxyHandler<undefined> = async (
  event
) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const res = await TaskEntity.update({
      workspaceId,
      entityId,
      _status: 'ARCHIVED',
      _ttl: Date.now() / 1000 + 30 * 24 * 60 * 60, // 30 days ttl
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
  const lastKey = event.queryStringParameters?.lastKey;
  try {
    const workspaceId = extractWorkspaceId(event);
    const res = await TaskEntity.query(workspaceId, {
      startKey: lastKey && {
        pk: workspaceId,
        sk: lastKey,
      },
      filters: [itemFilter('ACTIVE')],
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
        filters: [itemFilter('ACTIVE')],
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

export const deleteAllEntitiesOfNodeHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const tasksToDelete = (
      await TaskEntity.query(nodeId, {
        index: 'ak-pk-index',
        eq: nodeId,
        filters: [itemFilter('ACTIVE')],
      })
    ).Items;

    const batchReq: BatchUpdateRequest<Partial<Task>> = tasksToDelete.map(
      (task) => ({
        workspaceId: task.workspaceId,
        entityId: task.entityId,
        type: 'DELETE',
      })
    );

    await executeBatchRequest({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      associatedEntity: TaskEntity,
      workspaceId,
      request: batchReq,
      source: 'NOTE',
    });

    return {
      statusCode: 204,
      body: '',
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const restoreAllEntitiesOfNodeHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const tasksToRestore = (
      await TaskEntity.query(nodeId, {
        index: 'ak-pk-index',
        eq: nodeId,
        filters: [itemFilter('ARCHIVED')],
      })
    ).Items;

    const batchReq: BatchUpdateRequest<Partial<Task>> = tasksToRestore.map(
      (task) => ({
        workspaceId: task.workspaceId,
        entityId: task.entityId,
        type: 'DELETE',
      })
    );

    await executeBatchRequest({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      associatedEntity: TaskEntity,
      workspaceId,
      request: batchReq,
      source: 'NOTE',
    });

    return {
      statusCode: 204,
      body: '',
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getEntityOfMultipleNodesHandler: ValidatedAPIGatewayProxyHandler<{
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
  const successful = {};
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
            filters: [itemFilter('ACTIVE')],
          })
        ).Items;
        successful[nodeId] = res;
      }
    })
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ Items: successful, Failed: failed }),
  };
};

export const batchUpdateHandler: ValidatedAPIGatewayProxyHandler<
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
    const batchRequestResult = await executeBatchRequest({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      associatedEntity: TaskEntity,
      workspaceId,
      request: req,
      source: 'NOTE',
    });
    return {
      statusCode: 200,
      body: JSON.stringify(batchRequestResult),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
