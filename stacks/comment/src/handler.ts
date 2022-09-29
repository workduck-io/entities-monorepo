import { getAccess } from '@mex/access-checker';
import {
  BatchUpdateRequest,
  executeBatchRequest,
  itemFilter,
} from '@mex/entity-utils';
import {
  extractWorkspaceId,
  ValidatedAPIGatewayProxyHandler,
} from '@mex/gen-utils';
import { middyfy } from '@mex/middy-utils';
import { createError } from '@middy/util';
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

const getHandler: ValidatedAPIGatewayProxyHandler<undefined> = async (
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

const deleteHandler: ValidatedAPIGatewayProxyHandler<undefined> = async (
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

const getAllEntitiesOfNodeHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const nodeId = event.pathParameters.nodeId;
    const blockId = event.queryStringParameters?.blockId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
    let res;
    if (!blockId) {
      res = (
        await CommentEntity.query(workspaceId, {
          index: 'pk-ak-index',
          beginsWith: nodeId,
        })
      ).Items;
    } else {
      res = (
        await CommentEntity.query(workspaceId, {
          index: 'pk-ak-index',
          beginsWith: `${nodeId}#${blockId}`,
        })
      ).Items;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

const deleteAllEntitiesOfNodeHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const nodeId = event.pathParameters.nodeId;
    const blockId = event.queryStringParameters?.blockId;
    const workspaceId = extractWorkspaceId(event);
    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
    let commentsToDelete;
    if (!blockId)
      commentsToDelete = (
        await CommentEntity.query(workspaceId, {
          index: 'pk-ak-index',
          beginsWith: nodeId,
          filters: [itemFilter('ACTIVE')],
        })
      ).Items;
    else
      commentsToDelete = (
        await CommentEntity.query(workspaceId, {
          index: 'pk-ak-index',
          beginsWith: `${nodeId}#${blockId}`,
          filters: [itemFilter('ACTIVE')],
        })
      ).Items;

    const batchReq: BatchUpdateRequest<Partial<Comment>> = commentsToDelete.map(
      (comment) => ({
        workspaceId: comment.workspaceId,
        entityId: comment.entityId,
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
      source: 'EXTERNAL',
    });

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
