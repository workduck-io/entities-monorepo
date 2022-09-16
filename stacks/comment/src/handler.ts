import { getAccess } from '@mex/access-checker';
import { BatchUpdateRequest, createBatchRequest } from '@mex/entity-utils';
import {
  extractWorkspaceId,
  ValidatedAPIGatewayProxyHandler,
} from '@mex/gen-utils';
import { middyfy } from '@mex/middy-utils';
import { createError } from '@middy/util';
import { commentTable } from '../service/DynamoDB';
import { CommentEntity } from './entities';
import { Comment } from './interface';

const createHandler: ValidatedAPIGatewayProxyHandler<Comment> = async (
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
        { ...comment, workspaceId, source: 'EXTERNAL' },
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
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
    const res = (
      await CommentEntity.query(nodeId, {
        index: 'ak-pk-index',
        eq: nodeId,
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

    const commentsToDelete = (
      await CommentEntity.query(nodeId, {
        index: 'ak-pk-index',
        eq: nodeId,
      })
    ).Items;

    const batchReq: BatchUpdateRequest<Partial<Comment>> = commentsToDelete.map(
      (comment) => ({
        workspaceId: comment.workspaceId,
        entityId: comment.entityId,
        type: 'DELETE',
      })
    );

    const batchRequest = createBatchRequest({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      associatedEntity: CommentEntity,
      workspaceId,
      request: batchReq,
      source: 'EXTERNAL',
    });

    await Promise.all(
      batchRequest.map(async (chunk) => await commentTable.batchWrite(chunk))
    );
    return {
      statusCode: 204,
      body: '',
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const create = middyfy(createHandler);
export const get = middyfy(getHandler);
export const del = middyfy(deleteHandler);
export const getAllEntitiesOfNode = middyfy(getAllEntitiesOfNodeHandler);
export const deleteAllEntitiesOfNode = middyfy(deleteAllEntitiesOfNodeHandler);
