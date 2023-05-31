import {
  AdvancedElements,
  getPathForEntity,
  HierarchyOps,
} from '@mex/entity-utils';
import {
  extractUserId,
  extractWorkspaceId,
  generateCaptureId,
} from '@mex/gen-utils';
import { createError } from '@middy/util';
import {
  HTTPMethod,
  Path,
  Query,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { CaptureEntity } from '../entities';
import { Capture, CaptureRequest } from '../interface';

const CaptureHierarchyOps = new HierarchyOps(CaptureEntity);
const CAPTURE_PARENT_ENTITY = 'captureConfig';

export class CaptureHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createCapture(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserId(event);

    const capture =
      typeof event.body === 'string'
        ? (JSON.parse(event.body) as CaptureRequest)
        : (event.body as CaptureRequest);
    const entityId = capture.id ?? generateCaptureId();
    const parent = capture.data?.elementMetadata?.configID;

    await CaptureHierarchyOps.addItem<Capture>(
      { entityId, workspaceId, parent },
      {
        data: capture.data,
        configId: parent,
        userId,
        workspaceId,
        entityId,
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ id: entityId }),
    };
  }

  @Route({
    method: HTTPMethod.PATCH,
    path: '/{id}',
  })
  async updateCapture(
    event: ValidatedAPIGatewayProxyEvent<any>,
    @Path() path?
  ) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserId(event);
    const entityId = path.id;
    const capture =
      typeof event.body === 'string'
        ? (JSON.parse(event.body) as Capture)
        : (event.body as Capture);

    if (!entityId)
      throw createError(
        400,
        JSON.stringify({ statusCode: 400, message: 'id field required' })
      );
    const response = (await CaptureHierarchyOps.getItem(
      entityId
    )) as Capture & { path: string };
    const parent = capture.data?.elementMetadata?.configID;

    // configID should not be updated
    // in any situations
    if (parent !== response.configId)
      throw createError(
        400,
        JSON.stringify({
          statusCode: 400,
          message: 'Cannot change the configID',
        })
      );

    // Making sure the create metadata
    // is not updated by overwriting
    capture.data.createdAt = response.data.createdAt;
    capture.data.createdBy = response.data.createdBy;

    await CaptureEntity.put({
      workspaceId,
      entityId,
      data: capture.data,
      configId: parent,
      userId,
    });

    return {
      statusCode: 204,
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/{id}',
  })
  async getCapture(_: ValidatedAPIGatewayProxyEvent<any>, @Path() path?) {
    const entityId = path.id;
    const response = await CaptureHierarchyOps.getItem(entityId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...response.data,
        entityRefID: entityId,
      } as AdvancedElements),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/all',
  })
  async getAllCaptures(
    event: ValidatedAPIGatewayProxyEvent<any>,
    @Query() query?
  ) {
    const filterType = query?.filterType;
    const filterValue = query?.filterValue;
    const lastKey = query?.lastKey;

    if (!filterType)
      throw createError(
        400,
        JSON.stringify({
          statusCode: 400,
          message: 'QueryParams filterType required',
        })
      );

    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserId(event);
    let response: any;

    switch (filterType) {
      case 'configID':
        if (!filterValue)
          throw createError(
            400,
            JSON.stringify({
              statusCode: 400,
              message:
                'QueryParams filterValue required for filterType configID',
            })
          );
        response = await CaptureEntity.query(workspaceId, {
          startKey: lastKey && {
            pk: workspaceId,
            sk: lastKey,
          },
          index: 'pk-ak-index',
          eq: filterValue,
        });
        break;
      case 'userID':
        response = await CaptureEntity.query(workspaceId, {
          startKey: lastKey && {
            pk: workspaceId,
            sk: lastKey,
          },
          beginsWith: 'CAPTURE_',
          filters: [
            {
              attr: 'userId',
              eq: userId,
            },
          ],
        });
        break;
      case 'workspaceID':
        response = await CaptureEntity.query(workspaceId, {
          startKey: lastKey && {
            pk: workspaceId,
            sk: lastKey,
          },
          beginsWith: 'CAPTURE_',
        });
        break;
      default:
        break;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        Items: [
          ...(
            await getPathForEntity(
              CaptureHierarchyOps,
              workspaceId,
              response.Items,
              CAPTURE_PARENT_ENTITY
            )
          ).map((item: Capture) => {
            return { ...item.data, entityRefID: item.entityId };
          }),
        ],
        lastKey: response.LastEvaluatedKey?.sk ?? undefined,
      }),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/{id}',
  })
  async deleteCapture(_: ValidatedAPIGatewayProxyEvent<any>, @Path() path?) {
    const entityId = path.id;

    await CaptureHierarchyOps.deleteItem(entityId);

    return { statusCode: 204 };
  }
  @RouteAndExec()
  execute(event) {
    return event;
  }
}
