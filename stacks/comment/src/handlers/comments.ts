import { getAccess } from '@mex/access-checker';
import {
  BatchUpdateRequest,
  executeBatchRequest,
  itemFilter,
} from '@mex/entity-utils';
import { extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { CommentEntity } from '../entities';
import { Comment } from '../interface';

export const createHandler: ValidatedAPIGatewayProxyHandler<Comment> = async (
  event
) => {
  const workspaceId = extractWorkspaceId(event);
  const comment = event.body;
  if (comment.workspaceId && workspaceId != comment.workspaceId) {
    const access = await getAccess(workspaceId, comment.nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
  }
  try {
    const res = (
      await CommentEntity.update(
        { ...comment, workspaceId, _source: 'EXTERNAL' },
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
      await CommentEntity.get({
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
    const res = await CommentEntity.delete({
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
      await CommentEntity.query(workspaceId, {
        index: 'pk-ak-index',
        beginsWith: blockId
          ? threadId
            ? `${nodeId}#${blockId}#${threadId}`
            : `${nodeId}#${blockId}`
          : nodeId,
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
    const blockId = event.pathParameters?.blockId;
    const threadId = event.pathParameters?.threadId;

    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
    const commentsToDelete = (
      await CommentEntity.query(workspaceId, {
        index: 'pk-ak-index',
        beginsWith: blockId
          ? threadId
            ? `${nodeId}#${blockId}#${threadId}`
            : `${nodeId}#${blockId}`
          : nodeId,
        filters: [itemFilter('ACTIVE')],
      })
    ).Items;

    const batchReq: BatchUpdateRequest<Partial<Comment>> = commentsToDelete.map(
      (comment) => ({
        workspaceId: comment.workspaceId,
        entityId: comment.entityId,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        blockId: comment.blockId,
        type: 'DELETE',
      })
    );

    await executeBatchRequest({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      associatedEntity: CommentEntity,
      workspaceId,
      request: batchReq,
      _source: 'EXTERNAL',
    });

    return {
      statusCode: 204,
      body: '',
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
