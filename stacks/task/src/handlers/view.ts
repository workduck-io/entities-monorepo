import { entityFilter, HierarchyOps } from '@mex/entity-utils';
import { extractWorkspaceId, InternalError } from '@mex/gen-utils';
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
  async createViewHandler(
    event: ValidatedAPIGatewayProxyEvent<View & { parent: string }>
  ) {
    const workspaceId = extractWorkspaceId(event);

    const view = event.body;

    const { parent, ...rest } = view;
    const res = await HierarchyOps.addItem<View>(
      { entityId: view.entityId, workspaceId, parent },
      // 'VIEW_124'
      ViewEntity,
      {
        ...rest,
        workspaceId,
      }
    );
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
    const entityId = event.pathParameters.entityId;
    const res = await HierarchyOps.getItem(entityId, ViewEntity);
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
    await HierarchyOps.deleteItem(entityId, ViewEntity);
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
    const res = (
      await ViewEntity.query(workspaceId, {
        beginsWith: 'TASKVIEW',
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
