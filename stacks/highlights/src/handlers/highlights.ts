import { entityFilter } from '@mex/entity-utils';
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
import { highlightsTable } from '../../service/DynamoDB';
import { HighlightsEntity } from '../entities';
import { Highlights } from '../interface';

@InternalError()
export class HighlightsHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createHandler(event: ValidatedAPIGatewayProxyEvent<Highlights>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const highlights = event.body;
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
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/{entityId}',
  })
  async getHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
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
  }

  @Route({
    method: HTTPMethod.POST,
    path: '/multiple',
  })
  async getMultipleHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
    const body = event.body;
    const highlightList = (
      await Promise.allSettled(
        body.ids.map(async (id: string) => {
          const res = await HighlightsEntity.query(id, {
            index: 'sk-ak-index',
          });
          return res.Items.find(Boolean); // Safely return the first element of array;
        })
      )
    )
      .map((result) => {
        return result.status === 'fulfilled' && result.value
          ? HighlightsEntity.getBatch({
              workspaceId: result.value.pk,
              entityId: result.value.sk,
            })
          : undefined;
      })
      .filter((result) => result !== undefined);
    const res = highlightList.length
      ? await highlightsTable.batchGet(highlightList)
      : {};

    if (!res) throw createError(404, 'Item not found');
    return {
      statusCode: 200,
      body: JSON.stringify(res?.Responses?.[highlightsTable.name] ?? []),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/{entityId}',
  })
  async deleteHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
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
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/all',
  })
  async getAllEntitiesOfWorkspaceHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const lastKey = event.queryStringParameters?.lastKey;
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
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/all/{urlHash}',
  })
  async getAllEntitiesOfURLHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
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
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/all/{urlHash}',
  })
  async deleteAllEntitiesOfURLHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
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
  }
  @RouteAndExec()
  execute(event) {
    return event;
  }
}
