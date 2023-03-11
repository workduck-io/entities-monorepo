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
import { InferEntityItem } from 'dynamodb-toolbox';
import { sanitizeComment } from '../../utils/helpers';
import { CommentEntity } from '../entities';

@InternalError()
export class CommentsHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createHandler(
    event: ValidatedAPIGatewayProxyEvent<InferEntityItem<typeof CommentEntity>>
  ) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const comment = event.body;
    if (comment.workspaceId && workspaceId != comment.workspaceId) {
      const access = await getAccess(workspaceId, comment.nodeId, event);
      if (access === 'NO_ACCESS' || access === 'READ')
        throw createError(401, 'User access denied');
    }
    const res = (
      await CommentEntity.update(
        {
          ...comment,
          workspaceId,
          userId,
          _source: 'EXTERNAL',
          _status: 'ACTIVE',
        },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;
    return {
      statusCode: 200,
      body: JSON.stringify(sanitizeComment(res)),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/{nodeId}/{entityId}',
  })
  async getHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ): Promise<{ statusCode: number; body: string }> {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const nodeId = event.pathParameters.nodeId;

    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const res = (
      await CommentEntity.get({
        nodeId,
        entityId,
      })
    ).Item;
    if (!res) throw createError(404, 'Item not found');
    return {
      statusCode: 200,
      //NOTE: Do away with it when toolbox adds format function
      body: JSON.stringify(sanitizeComment(res)),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/{nodeId}/{entityId}',
  })
  async deleteHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const nodeId = event.pathParameters.nodeId;

    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    await CommentEntity.delete({
      nodeId,
      entityId,
    });
    return {
      statusCode: 204,
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path:
      '/all/{nodeId}' ||
      '/all/{nodeId}/block/{blockId}' ||
      '/all/{nodeId}/block/{blockId}/thread/{threadId}',
  })
  async getAllEntitiesOfNodeHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const nodeId = event.pathParameters.nodeId;
    const blockId = event.pathParameters?.blockId;
    const threadId = event.pathParameters?.threadId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
    const res = (
      await CommentEntity.query(nodeId, {
        index: 'pk-ak-index',
        ...(blockId && {
          beginsWith: threadId ? `${blockId}#${threadId}` : `${blockId}#`,
        }),
        filters: [statusFilter('ACTIVE'), entityFilter('comment')],
      })
    ).Items;

    return {
      statusCode: 200,
      body: JSON.stringify(res.map(sanitizeComment)),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/all/{nodeId}' || '/all/{nodeId}/block/{blockId}' ||  '/all/{nodeId}/block/{blockId}/thread/{threadId}',
  })
  async deleteAllEntitiesOfNodeHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const nodeId = event.pathParameters.nodeId;
    const blockId = event.pathParameters?.blockId;
    const threadId = event.pathParameters?.threadId;

    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
    const commentsToDelete = (
      await CommentEntity.query(nodeId, {
        index: 'pk-ak-index',
        beginsWith: blockId
          ? threadId
            ? `${blockId}#${threadId}`
            : `${blockId}#`
          : nodeId,
        filters: [statusFilter('ACTIVE'), entityFilter('comment')],
      })
    ).Items;

    const batchReq: BatchUpdateRequest<any> = commentsToDelete.map(
      (comment) => ({
        workspaceId: comment.workspaceId,
        entityId: comment.entityId,
        blockId: comment.blockId,
        type: 'DELETE',
      })
    );

    await executeBatchRequest({
      associatedEntity: CommentEntity,
      workspaceId,
      request: batchReq,
      source: 'EXTERNAL',
    });

    return {
      statusCode: 204,
    };
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
