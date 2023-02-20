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
import { injectable } from 'inversify';
import { getAccess } from '@mex/access-checker';
import { entityFilter, statusFilter } from '@mex/entity-utils';
import { nanoid } from 'nanoid';
import { CaptureVariableEntity } from '../entities';

@injectable()
@InternalError()
export class VariableHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/variable',
  })
  async createVariable(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const variable = event.body;
    if (variable.workspaceId && workspaceId != variable.workspaceId) {
      const access = await getAccess(workspaceId, variable.nodeId, event);
      if (access === 'NO_ACCESS' || access === 'READ')
        throw createError(401, 'User access denied');
    }
    try {
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
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  }
  @Route({
    method: HTTPMethod.GET,
    path: '/variables',
  })
  async getAllVariables(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    try {
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
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  }
  @Route({
    method: HTTPMethod.GET,
    path: '/variable/{variableId}',
  })
  async getVariable(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event) as string;
    const variableId = event.pathParameters.variableId;
    try {
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
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  }
  @Route({
    method: HTTPMethod.DELETE,
    path: '/variable/{variableId}',
  })
  async deleteVariable(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event) as string;
    const variableId = event.pathParameters.variableId;
    try {
      await CaptureVariableEntity.delete({
        workspaceId,
        entityId: variableId,
      });

      return {
        statusCode: 204,
      };
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  }
  @RouteAndExec()
  execute(event) {
    return event;
  }
}
