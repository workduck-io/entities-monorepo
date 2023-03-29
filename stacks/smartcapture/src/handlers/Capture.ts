import { entityFilter, statusFilter } from '@mex/entity-utils';
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
    const entityId = capture.id ?? generateCaptureId();
    const configId = capture.data?.elementMetadata?.configID;

    await CaptureEntity.put({
      ...capture,
      configId,
      workspaceId,
      entityId,
      userId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: entityId }),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/capture/{captureId}',
  })
  async getCapture(event: ValidatedAPIGatewayProxyEvent<any>, @Path() path?) {
    const workspaceId = extractWorkspaceId(event);
    const entityId = path.captureId;

    const response = await CaptureEntity.get({
      workspaceId,
      entityId,
    });

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
      body: JSON.stringify(response.Item),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/config/{configId}/all',
  })
  async getAllCaptureForConfig(
    event: ValidatedAPIGatewayProxyEvent<any>,
    @Path() path?
  ) {
    const workspaceId = extractWorkspaceId(event);
    const configId = path.configId;

    const response = (
      await CaptureEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: configId,
        filters: [statusFilter('ACTIVE'), entityFilter('capture')],
      })
    ).Items;

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/workspacecaptures',
  })
  async getAllCapturesForWorkspace(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);

    const response = await CaptureEntity.query(workspaceId, {
      beginsWith: 'CAPTURE_',
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.Items),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/usercaptures',
  })
  async getAllCapturesForUser(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserId(event);

    const response = await CaptureEntity.query(workspaceId, {
      beginsWith: 'CAPTURE_',
      filters: [
        {
          attr: 'userId',
          eq: userId,
        },
      ],
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.Items),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/capture/{captureId}',
  })
  async deleteCapture(
    event: ValidatedAPIGatewayProxyEvent<any>,
    @Path() path?
  ) {
    const workspaceId = extractWorkspaceId(event);
    const entityId = path.captureId;

    const res = await CaptureEntity.delete({
      workspaceId,
      entityId,
    });

    console.log({ res });

    if (Object.keys(res).length)
      throw createError(
        404,
        JSON.stringify({
          statusCode: 404,
          message: 'Requested Capture not found to delete',
        })
      );

    return { statusCode: 204 };
  }
  @RouteAndExec()
  execute(event) {
    return event;
  }
}
