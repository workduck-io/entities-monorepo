import { entityFilter, statusFilter } from '@mex/entity-utils';
import {
  extractUserIdFromToken,
  extractWorkspaceId,
  InternalError,
} from '@mex/gen-utils';
import {
  HTTPMethod,
  Path,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { injectable } from 'inversify';
import { nanoid } from 'nanoid';
import { CaptureEntity } from '../entities';
import { Capture } from '../interface';

@injectable()
@InternalError()
export class CaptureHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/capture',
  })
  async createCapture(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const capture = event.body as Capture;

    await CaptureEntity.put({
      ...capture,
      workspaceId,
      captureId: capture.captureId ?? `CAPTURE_${nanoid()}`,
      userId,
    });

    return {
      statusCode: 204,
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/config/{configId}/capture/{captureId}',
  })
  async getCapture(event: ValidatedAPIGatewayProxyEvent<any>, @Path() path?) {
    const workspaceId = extractWorkspaceId(event);
    const captureId = path.captureId;
    const configId = path.configId;

    const response = await CaptureEntity.get({
      workspaceId,
      configId,
      captureId,
    });

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

    const response = await CaptureEntity.query(`${workspaceId}#${configId}`, {
      beginsWith: 'CAPTURE_',
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.Items),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/config/{configId}/captures',
  })
  async getAllCapturesForUser(
    event: ValidatedAPIGatewayProxyEvent<any>,
    @Path() path?
  ) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const configId = path.configId;
    const pk = `${workspaceId}#${configId}`;

    const response = (
      await CaptureEntity.query(pk, {
        index: 'pk-ak-index',
        eq: userId,
        filters: [statusFilter('ACTIVE'), entityFilter('capture')],
      })
    ).Items;
    console.log({ response });

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/config/{configId}/capture/{captureId}',
  })
  async deleteCapture(
    event: ValidatedAPIGatewayProxyEvent<any>,
    @Path() path?
  ) {
    const workspaceId = extractWorkspaceId(event);
    const configId = path.configId;
    const captureId = path.captureId;

    await CaptureEntity.delete({ workspaceId, configId, captureId });

    return { statusCode: 204 };
  }
  @RouteAndExec()
  execute(event) {
    return event;
  }
}
