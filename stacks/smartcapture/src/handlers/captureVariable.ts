import { getAccess } from '@mex/access-checker';
import { entityFilter, statusFilter } from '@mex/entity-utils';
import {
  extractUserIdFromToken,
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
import { nanoid } from 'nanoid';
import { CaptureVariableEntity } from '../entities';
import { Variable } from '../interface';

@InternalError()
export class CaptureVariablesHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/variable',
  })
  async createHandler(event: ValidatedAPIGatewayProxyEvent<Variable>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const variable = event.body;
    if (variable.workspaceId && workspaceId != variable.workspaceId) {
      const access = await getAccess(workspaceId, variable.nodeId, event);
      if (access === 'NO_ACCESS' || access === 'READ')
        throw createError(401, 'User access denied');
    }
    const payload = {
      entityId: variable.entityId ?? nanoid(),
      variableName: variable.variableName,
      workspaceId,
      _source: 'EXTERNAL',
      userId,
    };
    await CaptureVariableEntity.put({
      ...payload,
    });

    return {
      statusCode: 204,
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/variables',
  })
  async getAllVariablesHandler(event: ValidatedAPIGatewayProxyEvent<Variable>) {
    const workspaceId = extractWorkspaceId(event);
    const res = (
      await CaptureVariableEntity.query(workspaceId, {
        beginsWith: 'VARIABLE',
        filters: [statusFilter('ACTIVE'), entityFilter('captureVariable')],
      })
    ).Items;

    return {
      statusCode: 200,
      body: JSON.stringify(res),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/variable/{variableId}',
  })
  async getVariableHandler(event: ValidatedAPIGatewayProxyEvent<Variable>) {
    const workspaceId = extractWorkspaceId(event) as string;
    const variableId = event.pathParameters.variableId;
    const res = await (
      await CaptureVariableEntity.get({
        workspaceId,
        entityId: variableId,
      })
    ).Item;

    if (res)
      return {
        statusCode: 200,
        body: JSON.stringify(res),
      };
    else throw new Error();
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/variable/{variableId}',
  })
  async deleteVariableHandler(event: ValidatedAPIGatewayProxyEvent<Variable>) {
    const workspaceId = extractWorkspaceId(event) as string;
    const variableId = event.pathParameters.variableId;
    await CaptureVariableEntity.delete({
      workspaceId,
      entityId: variableId,
    });

    return {
      statusCode: 204,
    };
  }
  
  @RouteAndExec()
  execute(event) {
    return event;
  }
}
