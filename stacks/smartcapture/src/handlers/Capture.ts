import { getPathForEntity, HierarchyOps } from '@mex/entity-utils';
import {
  extractUserId,
  extractWorkspaceId,
  generateCaptureId,
  InternalError,
} from '@mex/gen-utils';
import { createError } from '@middy/util';
import {
  HTTPMethod,
  Path,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { CaptureEntity } from '../entities';
import { Capture } from '../interface';

const CaptureHierarchyOps = new HierarchyOps(CaptureEntity);
const CAPTURE_PARENT_ENTITY = 'captureConfig';
@InternalError()
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
    method: HTTPMethod.GET,
    path: '/capture/{captureID}',
  })
  async getCapture(_: ValidatedAPIGatewayProxyEvent<any>, @Path() path?) {
    const entityId = path.captureID;
    const response = await CaptureHierarchyOps.getItem(entityId);

    if (!Object.keys(response).length)
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Requested Capture not found',
        })
      );

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/capture/config/{configID}/all',
  })
  async getAllCaptureForConfig(
    event: ValidatedAPIGatewayProxyEvent<any>,
    @Path() path?
  ) {
    const configId = path.configID;
    const response = await CaptureHierarchyOps.getItemChildren(configId, false);

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/capture/all/workspace',
  })
  async getAllCapturesForWorkspace(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);

    const response = (
      await CaptureEntity.query(workspaceId, {
        beginsWith: 'CAPTURE_',
      })
    ).Items;

    return {
      statusCode: 200,
      body: JSON.stringify(
        await getPathForEntity(
          CaptureHierarchyOps,
          workspaceId,
          response,
          CAPTURE_PARENT_ENTITY
        )
      ),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/capture/all/user',
  })
  async getAllCapturesForUser(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserId(event);

    const response = (
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

    return {
      statusCode: 200,
      body: JSON.stringify(
        await getPathForEntity(
          CaptureHierarchyOps,
          workspaceId,
          response,
          CAPTURE_PARENT_ENTITY
        )
      ),
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
