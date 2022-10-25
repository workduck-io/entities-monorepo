import { entityFilter } from '@mex/entity-utils';
import { extractApiVersion, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { ViewEntity } from '../entities';
import { View } from '../interface';

export const createViewHandler: ValidatedAPIGatewayProxyHandler<View> = async (
  event
) => {
  const workspaceId = extractWorkspaceId(event);

  const view = event.body;
  try {
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
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getViewHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const res = (
      await ViewEntity.get({
        workspaceId,
        entityId,
      })
    ).Item;
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const deleteViewHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const entityId = event.pathParameters.entityId;
    const res = await ViewEntity.delete({
      workspaceId,
      entityId,
    });
    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getAllViewsOfWorkspaceHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
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
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
