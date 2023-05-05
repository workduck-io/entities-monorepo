import { AdvancedElementEntity, HierarchyOps } from '@mex/entity-utils';
import {
  extractUserId,
  extractWorkspaceId,
  generateHighlightId,
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
import {
  deserializeMultipleHighlights,
  highlightDeserializer,
  highlightSerializer,
} from '../serializers';

const HighlightHierarchyOps = new HierarchyOps(HighlightsEntity);

export class HighlightsHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
    const parentHighlightId = event.queryStringParameters?.parentID;
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserId(event);
    const highlightBody =
      typeof event.body === 'string'
        ? (JSON.parse(event.body) as AdvancedElementEntity)
        : (event.body as AdvancedElementEntity);
    let highlightId = generateHighlightId();

    if (parentHighlightId) {
      let highlight: Highlights;
      if (highlightBody) {
        highlight = highlightSerializer(highlightBody.data) as Highlights;
      } else
        highlight = (
          await HighlightsEntity.get({
            workspaceId,
            entityId: parentHighlightId,
          })
        ).Item as unknown as Highlights;

      await HighlightHierarchyOps.addItem<Highlights>(
        {
          entityId: highlightId,
          workspaceId,
          parent: parentHighlightId,
        },
        {
          ...highlight,
          entityId: highlightId,
          workspaceId,
          userId,
          _source: 'EXTERNAL',
        }
      );
    } else {
      highlightId = highlightBody.id ?? highlightId;
      const serializedHighlight = highlightSerializer(
        highlightBody.data
      ) as Highlights;

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
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ id: highlightId }),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/instances/all/{id}',
  })
  async getAllInstancesForHighlightHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
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

    if (!res)
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Item not found',
        })
      );
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

    if (!res)
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Item not found',
        })
      );

    return {
      statusCode: 200,
      body: JSON.stringify({
        Items:
          deserializeMultipleHighlights(
            res?.Responses?.[highlightsTable.name]
          ) ?? [],
      }),
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
    const workspaceId = extractWorkspaceId(event);
    const res = await HighlightHierarchyOps.getAllByTree(workspaceId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        Items: deserializeMultipleHighlights(res),
      }),
    };
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
