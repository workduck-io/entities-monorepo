import { entityFilter, HierarchyOps } from '@mex/entity-utils';
import {
  extractUserId,
  extractWorkspaceId,
  generateHighlightId,
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
import { HighlightData, Highlights } from '../interface';
import {
  deserializeMultipleHighlights,
  highlightDeserializer,
  highlightSerializer,
} from '../serializers';

const HighlightHierarchyOps = new HierarchyOps(HighlightsEntity);

@InternalError()
export class HighlightsHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createHandler(event: ValidatedAPIGatewayProxyEvent<HighlightData>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserId(event);
    const highlights =
      typeof event.body === 'string'
        ? (JSON.parse(event.body) as HighlightData)
        : (event.body as HighlightData);
    const highlightId = highlights.id ?? generateHighlightId();
    const serializedHighlight = highlightSerializer(
      highlights
    ) as unknown as Highlights;

    await HighlightHierarchyOps.addItem<Highlights>(
      {
        entityId: highlightId,
        workspaceId,
      },
      {
        ...serializedHighlight,
        workspaceId,
        userId,
        _source: 'EXTERNAL',
        entityId: highlightId,
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ id: highlightId }),
    };
  }

  @Route({
    method: HTTPMethod.POST,
    path: '/instance/{id}',
  })
  async createHighlightInstanceHandler(
    event: ValidatedAPIGatewayProxyEvent<HighlightData>
  ) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserId(event);
    const entityId = event.pathParameters.id;
    const newEntityId = generateHighlightId();
    const highlight = (
      await HighlightsEntity.get({
        workspaceId,
        entityId,
      })
    ).Item as unknown as Highlights;

    await HighlightHierarchyOps.addItem<Highlights>(
      {
        entityId: newEntityId,
        workspaceId,
        parent: entityId,
      },
      {
        ...highlight,
        entityId: newEntityId,
        workspaceId,
        userId,
        _source: 'EXTERNAL',
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ id: newEntityId }),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/instances/all/{id}',
  })
  async getAllInstancesForHighlightHandler(
    event: ValidatedAPIGatewayProxyEvent<HighlightData>
  ) {
    const workspaceId = extractWorkspaceId(event);
    const parentId = event.pathParameters.id;

    const allInstances = await HighlightHierarchyOps.getItemChildren(
      parentId,
      workspaceId,
      false
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        Items: deserializeMultipleHighlights(allInstances),
      }),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/{id}',
  })
  async getHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.id;
    const res = (
      await HighlightsEntity.get({
        workspaceId,
        entityId,
      })
    ).Item as Partial<Highlights>;

    if (!res) throw createError(404, 'Item not found');
    return {
      statusCode: 200,
      body: JSON.stringify(highlightDeserializer(res)),
    };
  }

  @Route({
    method: HTTPMethod.POST,
    path: '/multiple',
  })
  async getMultipleHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
    const highlightIds =
      typeof event.body === 'string'
        ? (JSON.parse(event.body).ids as any)
        : (event.body.ids as string[]);

    const highlightList = (
      await Promise.allSettled(
        highlightIds.map(async (id: string) => {
          const res = await HighlightsEntity.query(id, {
            index: 'sk-ak-index',
            beginsWith: 'URL_',
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
      body: JSON.stringify(
        deserializeMultipleHighlights(res?.Responses?.[highlightsTable.name]) ??
          []
      ),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/{id}',
  })
  async deleteHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
    const entityId = event.pathParameters.id;
    await HighlightHierarchyOps.deleteItem(entityId);

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
        Items: deserializeMultipleHighlights(res.Items),
        lastKey: res.LastEvaluatedKey?.sk ?? undefined,
      }),
    };
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
