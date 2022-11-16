import { entityFilter } from '@mex/entity-utils';
import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { HighlightsEntity } from '../entities';
import { Highlights } from '../interface';

export const createHandler: ValidatedAPIGatewayProxyHandler<
  Highlights
> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const userId = extractUserIdFromToken(event);
  const highlights = event.body;
  try {
    const res = (
      await HighlightsEntity.update(
        { ...highlights, workspaceId, userId, _source: 'EXTERNAL' },
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
      await HighlightsEntity.get({
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
    await HighlightsEntity.delete({
      workspaceId,
      entityId,
    });

    return {
      statusCode: 204,
      body: '',
    };
  } catch (e) {
    throw createError(e.statusCode ?? 400, JSON.stringify(e.message));
  }
};

export const getAllEntitiesOfWorkspaceHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  const lastKey = event.queryStringParameters?.lastKey;
  try {
    const workspaceId = extractWorkspaceId(event);
    const res = await HighlightsEntity.query(workspaceId, {
      startKey: lastKey && {
        pk: workspaceId,
        sk: lastKey,
      },
      beginsWith: 'HIGHLIGHT_',
      filters: [entityFilter('highlights')],
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

export const getAllEntitiesOfURLHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const urlHash = event.pathParameters.urlHash;
    const workspaceId = extractWorkspaceId(event);
    const res = (
      await HighlightsEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: `URL_${urlHash}`,
        filters: [entityFilter('highlights')],
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

export const deleteAllEntitiesOfURLHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const urlHash = event.pathParameters.urlHash;
    const workspaceId = extractWorkspaceId(event);

    const tasksToDelete = (
      await HighlightsEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: `URL_${urlHash}`,
        filters: [entityFilter('highlights')],
      })
    ).Items;

    Promise.allSettled(
      tasksToDelete.map((t) =>
        HighlightsEntity.delete({ workspaceId, entityId: t.entityId })
      )
    );

    return {
      statusCode: 204,
      body: '',
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
