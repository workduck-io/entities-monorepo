import { getAccess } from '@mex/access-checker';
import {
  BatchUpdateRequest,
  entityFilter,
  executeBatchRequest,
  statusFilter,
} from '@mex/entity-utils';
import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { InferEntityItem } from 'dynamodb-toolbox';
import { sanitizeComment } from '../../utils/helpers';
import { CommentEntity } from '../entities';

export const createHandler: ValidatedAPIGatewayProxyHandler<
  InferEntityItem<typeof CommentEntity>
> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const userId = extractUserIdFromToken(event);
  const comment = event.body;
  if (comment.workspaceId && workspaceId != comment.workspaceId) {
    const access = await getAccess(workspaceId, comment.nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
  }
  try {
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
    return {
      statusCode: 200,
      //NOTE: Do away with it when toolbox adds format function
      body: JSON.stringify(sanitizeComment(res)),
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
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getAllEntitiesOfNodeHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
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
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const deleteAllEntitiesOfNodeHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
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
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
