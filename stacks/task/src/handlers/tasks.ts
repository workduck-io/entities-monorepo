import { getAccess } from '@mex/access-checker';
import {
  entityFilter,
  executeBatchRequest,
  MAX_DYNAMO_BATCH_REQUEST,
  statusFilter,
  type BatchUpdateRequest,
} from '@mex/entity-utils';
import { createError } from '@middy/util';

import {
  extractUserIdFromToken,
  extractWorkspaceId,
  InternalError,
} from '@mex/gen-utils';
import { ValidatedAPIGatewayProxyEvent } from '@workduck-io/lambda-routing';
import { TaskEntity } from '../entities';
import { Task } from '../interface';

@InternalError()
class TaskHandler {
  async getHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
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
  }

  async createHandler(event: ValidatedAPIGatewayProxyEvent<Task>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const task = event.body;
    if (task.workspaceId && workspaceId != task.workspaceId) {
      const access = await getAccess(workspaceId, task.nodeId, event);
      if (access === 'NO_ACCESS' || access === 'READ')
        throw createError(401, 'User access denied');
    }
    const res = (
      await TaskEntity.update(
        {
          ...task,
          workspaceId,
          userId,
          _source: 'EXTERNAL',
          $remove: ['_ttl'],
        },
        {
          returnValues: 'UPDATED_NEW',
        }
      )
    ).Attributes;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  }

  async deleteHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
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
  }

  async getAllEntitiesOfWorkspaceHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const lastKey = event.queryStringParameters?.lastKey;
    const workspaceId = extractWorkspaceId(event);
    const res = await TaskEntity.query(workspaceId, {
      startKey: lastKey && {
        pk: workspaceId,
        sk: lastKey,
      },
      filters: [statusFilter('ACTIVE'), entityFilter('task')],
    });
    return {
      statusCode: 200,
      body: JSON.stringify({
        Items: res.Items,
        lastKey: res.LastEvaluatedKey?.sk ?? undefined,
      }),
    };
  }

  async getAllEntitiesOfNodeHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
    const res = (
      await TaskEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: nodeId,
        filters: [statusFilter('ACTIVE'), entityFilter('task')],
      })
    ).Items;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  }

  async deleteAllEntitiesOfNodeHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const tasksToDelete = (
      await TaskEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: nodeId,
        filters: [statusFilter('ACTIVE'), entityFilter('task')],
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
      associatedEntity: TaskEntity,
      workspaceId,
      request: batchReq,
      source: 'INTERNAL',
    });

    return {
      statusCode: 204,
      body: '',
    };
  }

  async restoreAllEntitiesOfNodeHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const tasksToRestore = (
      await TaskEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: nodeId,
        filters: [statusFilter('ARCHIVED'), entityFilter('task')],
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
      associatedEntity: TaskEntity,
      workspaceId,
      request: batchReq,
      source: 'INTERNAL',
    });

    return {
      statusCode: 204,
      body: '',
    };
  }

  async getEntityOfMultipleNodesHandler(
    event: ValidatedAPIGatewayProxyEvent<{ nodes: string[] }>
  ) {
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
            await TaskEntity.query(workspaceId, {
              index: 'pk-ak-index',
              eq: nodeId,
              filters: [statusFilter('ACTIVE'), entityFilter('task')],
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
  }

  async batchUpdateHandler(
    event: ValidatedAPIGatewayProxyEvent<BatchUpdateRequest<Task>>
  ) {
    const workspaceId = extractWorkspaceId(event);
    const req = event.body;
    await Promise.all(
      [...new Set(req.map((r) => r.nodeId))].map(async (nodeId) => {
        const access = await getAccess(workspaceId, nodeId as string, event);
        if (access === 'NO_ACCESS' || access === 'READ')
          throw createError(401, 'User access denied');
      })
    );
    const batchRequestResult = await executeBatchRequest({
      associatedEntity: TaskEntity,
      workspaceId,
      request: req,
      source: 'INTERNAL',
    });
    return {
      statusCode: 200,
      body: JSON.stringify(batchRequestResult),
    };
  }
}

export const taskHandler = new TaskHandler();
