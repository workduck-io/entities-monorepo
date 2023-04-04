import { getPathForEntity, HierarchyOps } from '@mex/entity-utils';
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
import { Capture } from '../interface';

const CaptureHierarchyOps = new HierarchyOps(CaptureEntity);
const CAPTURE_PARENT_ENTITY = 'captureConfig';

export class CaptureHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/capture',
  })
  async createCapture(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserId(event);

    const capture =
      typeof event.body === 'string'
        ? (JSON.parse(event.body) as Capture)
        : (event.body as Capture);
    const entityId = capture.entityId ?? generateCaptureId();
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
    path: '/capture',
  })
  async updateCapture(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserId(event);

    const capture =
      typeof event.body === 'string'
        ? (JSON.parse(event.body) as Capture)
        : (event.body as Capture);
    const entityId = capture.entityId;
    const response = (await CaptureHierarchyOps.getItem(
      entityId
    )) as Capture & { path: string };
    const parent = capture.data?.elementMetadata?.configID;

    if (parent !== response.configId)
      throw createError(
        400,
        JSON.stringify({
          statusCode: 400,
          message: 'Cannot change the configID',
        })
      );

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
    path: '/capture/{captureID}',
  })
  async getCapture(_: ValidatedAPIGatewayProxyEvent<any>, @Path() path?) {
    const entityId = path.captureID;
    const response = await CaptureHierarchyOps.getItem(entityId);

    return {
      statusCode: 200,
      body: JSON.stringify({ data: response.data, id: entityId }),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/capture/all',
  })
  async getAllCaptures(
    event: ValidatedAPIGatewayProxyEvent<any>,
    @Path() path?,
    @Query() query?
  ) {
    const filterType = query?.filterType;
    const filterValue = query?.filterValue;

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
    let response: any[];

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
        response = await CaptureHierarchyOps.getItemChildren(
          filterValue,
          false
        );
        return {
          statusCode: 200,
          body: JSON.stringify([
            ...response.map((item: Capture) => {
              return { id: item.entityId, data: item.data };
            }),
          ]),
        };
      case 'userID':
        response = (
          await CaptureEntity.query(workspaceId, {
            beginsWith: 'CAPTURE_',
            filters: [
              {
                attr: 'userId',
                eq: userId,
              },
            ],
          })
        ).Items;
        break;
      case 'workspaceID':
        response = (
          await CaptureEntity.query(workspaceId, {
            beginsWith: 'CAPTURE_',
          })
        ).Items;
        break;
      default:
        break;
    }

    return {
      statusCode: 200,
      body: JSON.stringify([
        ...(
          await getPathForEntity(
            CaptureHierarchyOps,
            workspaceId,
            response,
            CAPTURE_PARENT_ENTITY
          )
        ).map((item: Capture) => {
          return { id: item.entityId, data: item.data };
        }),
      ]),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/capture/{captureID}',
  })
  async deleteCapture(_: ValidatedAPIGatewayProxyEvent<any>, @Path() path?) {
    const entityId = path.captureID;

    await CaptureHierarchyOps.deleteItem(entityId);

    return { statusCode: 204 };
  }
  @RouteAndExec()
  execute(event) {
    return event;
  }
}
