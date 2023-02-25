import { entityFilter } from '@mex/entity-utils';
import {
  extractApiVersion,
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
import { ViewEntity } from '../entities';
import { View } from '../interface';
@InternalError()
export class ViewHandler {
  @Route({
    path: '/view',
    method: HTTPMethod.POST,
  })
  async createViewHandler(event: ValidatedAPIGatewayProxyEvent<View>) {
    const workspaceId = extractWorkspaceId(event);

    const view = event.body;

    const res = (
      await ViewEntity.update(
        { ...view, workspaceId },
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
    path: '/view/{entityId}',
    method: HTTPMethod.GET,
  })
  async getViewHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const res = (
      await ViewEntity.get({
        workspaceId,
        entityId,
      })
    ).Item;
    if (!res) throw createError(404, 'View not found');
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  }

  @Route({
    path: '/view/{entityId}',
    method: HTTPMethod.DELETE,
  })
  async deleteViewHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    await ViewEntity.delete({
      workspaceId,
      entityId,
    });
    return {
      statusCode: 204,
    };
  }

  @Route({
    path: '/view/all/workspace',
    method: HTTPMethod.GET,
  })
  async getAllViewsOfWorkspaceHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const workspaceId = extractWorkspaceId(event);
    const apiVersion = extractApiVersion(event);
    const res = (
      await ViewEntity.query(workspaceId, {
        beginsWith: apiVersion ? 'TASKVIEW' : 'TASK_VIEW',
        filters: [entityFilter('view')],
      })
    ).Items;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
