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

const ViewHierarchyOps = new HierarchyOps(ViewEntity);
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
    const res = await ViewHierarchyOps.addItem<View>(
      { entityId: view.entityId, workspaceId, parent },
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
    const res = await ViewHierarchyOps.getItem(entityId);
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
    const entityId = event.pathParameters.entityId;
    await ViewHierarchyOps.deleteItem(entityId);
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
    const hierarchy = (await ViewHierarchyOps.getGraph(workspaceId)).map(
      (hItem) => ({
        path: hItem.path,
        ...res.find((item) => item.entityId === hItem.entityId),
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(hierarchy),
    };
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
