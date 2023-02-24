import { getAccess } from '@mex/access-checker';
import {
  BatchUpdateRequest,
  entityFilter,
  executeBatchRequest,
  statusFilter,
} from '@mex/entity-utils';
import {
  extractUserIdFromToken,
  extractWorkspaceId,
  InternalError,
} from '@mex/gen-utils';
import { createError } from '@middy/util';
import {
  HTTPMethod,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { ReminderEntity } from '../entities';
import { Reminder } from '../interface';

@InternalError()
export class ReminderHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createHandler(event: ValidatedAPIGatewayProxyEvent<Reminder>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const reminder = event.body;
    if (reminder.workspaceId && workspaceId != reminder.workspaceId) {
      const access = await getAccess(workspaceId, reminder.nodeId, event);
      if (access === 'NO_ACCESS' || access === 'READ')
        throw createError(401, 'User access denied');
    }

    const res = (
      await ReminderEntity.update(
        { ...reminder, workspaceId, userId },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/{entityId}',
  })
  async getHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const res = (
      await ReminderEntity.get({
        workspaceId,
        entityId,
      })
    ).Item;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/{entityId}',
  })
  async deleteHandler(event) {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const res = await ReminderEntity.update({
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

  @Route({
    method: HTTPMethod.GET,
    path: '/all/node/{nodeId}',
  })
  async getAllEntitiesOfNodeHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
    const res = (
      await ReminderEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: nodeId,
        filters: [statusFilter('ACTIVE'), entityFilter('reminder')],
      })
    ).Items;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/all/workspace',
  })
  async getAllEntitiesOfWorkspaceHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const lastKey = event.queryStringParameters?.lastKey;
    const workspaceId = extractWorkspaceId(event);
    const res = await ReminderEntity.query(workspaceId, {
      startKey: lastKey && {
        pk: workspaceId,
        sk: lastKey,
      },
      filters: [statusFilter('ACTIVE'), entityFilter('reminder')],
    });
    return {
      statusCode: 200,
      body: JSON.stringify({
        Items: res.Items,
        lastKey: res.LastEvaluatedKey?.sk ?? undefined,
      }),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/all/node/{nodeId}',
  })
  async deleteAllEntitiesOfNodeHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const tasksToDelete = (
      await ReminderEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: nodeId,
        filters: [statusFilter('ACTIVE'), entityFilter('reminder')],
      })
    ).Items;

    const batchReq: BatchUpdateRequest<Partial<Reminder>> = tasksToDelete.map(
      (task) => ({
        workspaceId: task.workspaceId,
        entityId: task.entityId,
        type: 'DELETE',
      })
    );

    await executeBatchRequest({
      associatedEntity: ReminderEntity,
      workspaceId,
      request: batchReq,
      source: 'INTERNAL',
    });

    return {
      statusCode: 204,
      body: '',
    };
  }

  @Route({
    method: HTTPMethod.POST,
    path: '/all/node/{nodeId}',
  })
  async restoreAllEntitiesOfNodeHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const nodeId = event.pathParameters.nodeId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const tasksToRestore = (
      await ReminderEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: nodeId,
        filters: [statusFilter('ARCHIVED'), entityFilter('reminder')],
      })
    ).Items;

    const batchReq: BatchUpdateRequest<Partial<Reminder>> = tasksToRestore.map(
      (task) => ({
        workspaceId: task.workspaceId,
        entityId: task.entityId,
        type: 'DELETE',
      })
    );

    await executeBatchRequest({
      associatedEntity: ReminderEntity,
      workspaceId,
      request: batchReq,
      source: 'INTERNAL',
    });

    return {
      statusCode: 204,
      body: '',
    };
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
