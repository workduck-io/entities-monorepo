import { ENTITYSOURCE } from '@mex/entity-utils';
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
import {
  serializeConfig,
  serializeConfigDelete,
  serializeConfigFormat,
} from '../../utils/helpers';
import { smartcaptureTable } from '../../service/DynamoDB';
import { CaptureConfigEntity, CaptureVariableLabelEntity } from '../entities';
import { Label } from '../interface';

@injectable()
@InternalError()
export class ConfigHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/config',
  })
  async createConfig(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const config = event.body;
    const labels = config.labels as Label[];
    const allTransacts = [];
    const configTransaction = CaptureConfigEntity.putTransaction({
      ...config,
      workspaceId,
      _source: ENTITYSOURCE.EXTERNAL,
      userId,
    });
    for (const label of labels) {
      if (label.variableId) {
        allTransacts.push(
          CaptureVariableLabelEntity.putTransaction({
            id: label.id,
            variableId: label.variableId,
            userId,
            base: config.base,
            configId: config.entityId,
          })
        );
      }
    }
    allTransacts.push(configTransaction);
    try {
      await smartcaptureTable.transactWrite(allTransacts);
      return {
        statusCode: 204,
      };
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  }
  @Route({
    method: HTTPMethod.PATCH,
    path: '/config/{configId}',
  })
  async updateConfig(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const config = event.body;
    const labels = config.labels as Label[];
    const allTransacts = [];
    try {
      for (const label of labels) {
        if (label.variableId) {
          allTransacts.push(
            CaptureVariableLabelEntity.updateTransaction({
              id: label.id,
              variableId: label.variableId,
              userId,
              base: config.base,
              configId: config.entityId,
            })
          );
        }
      }
      const updateObject = serializeConfig(config.labels).data;
      const updateItem = {
        ...config,
        labels: { $set: updateObject },
        workspaceId,
        _source: ENTITYSOURCE.EXTERNAL,
        userId,
      };
      allTransacts.push(CaptureConfigEntity.updateTransaction(updateItem));

      await smartcaptureTable.transactWrite(allTransacts);
      return {
        statusCode: 204,
      };
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  }
  @Route({
    method: HTTPMethod.DELETE,
    path: '/config/{configId}/labels',
  })
  async deleteLabel(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const config = event.body;
    const labels = config.labels as Label[];
    const allTransacts = [];

    for (const label of labels) {
      if (label.variableId) {
        allTransacts.push(
          CaptureVariableLabelEntity.deleteTransaction({
            id: label.id,
            variableId: label.variableId,
          })
        );
      }
    }

    const updateItem = {
      entityId: event.pathParameters.configId,
      labels: { $set: serializeConfigDelete(config.labels) },
      workspaceId,
      _source: ENTITYSOURCE.EXTERNAL,
      userId,
    };
    allTransacts.push(CaptureConfigEntity.updateTransaction(updateItem));

    try {
      await smartcaptureTable.transactWrite(allTransacts);
      return {
        statusCode: 204,
      };
    } catch (e) {
      throw createError(400, JSON.stringify(e.message));
    }
  }
  @Route({
    method: HTTPMethod.GET,
    path: '/config/{configId}',
  })
  async getConfig(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event) as string;
    const configId = event.pathParameters.configId;
    try {
      const res = (
        await CaptureConfigEntity.get({
          workspaceId,
          entityId: configId,
        })
      ).Item;

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
    path: '/config/all',
  })
  async getAllConfigOfWorkspace(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event) as string;
    try {
      const res = await CaptureConfigEntity.query(workspaceId, {
        beginsWith: 'CONFIG_',
      });
      return {
        statusCode: 200,
        body: JSON.stringify(res.Items),
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: `Cannot get config ${error}`,
      };
    }
  }
  @Route({
    method: HTTPMethod.GET,
    path: '/config/all/public',
  })
  async getAllConfigOfPublic(event: ValidatedAPIGatewayProxyEvent<any>) {
    try {
      const res = await CaptureConfigEntity.query('WORKSPACE_INTERNAL', {
        beginsWith: 'CONFIG_',
      });
      return {
        statusCode: 200,
        body: JSON.stringify(res.Items),
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: `Cannot get config ${error}`,
      };
    }
  }
  @Route({
    method: HTTPMethod.GET,
    path: '/config/all',
  })
  async getAllConfigOfBase(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event) as string;
    try {
      const res = await CaptureConfigEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: event.pathParameters.base,
      });
      return {
        statusCode: 200,
        body: JSON.stringify(res.Items),
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: `Cannot get config ${error}`,
      };
    }
  }
  @Route({
    method: HTTPMethod.DELETE,
    path: '/config/{configId}',
  })
  async deleteConfig(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event) as string;
    const configId = event.pathParameters.configId;
    try {
      await CaptureConfigEntity.delete({
        workspaceId,
        entityId: configId,
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
    path: '/variable/{variableId}/labels/all',
  })
  async getAllLabelsForVariable(event: ValidatedAPIGatewayProxyEvent<any>) {
    const variableId = event.pathParameters.variableId;
    try {
      const res = await CaptureVariableLabelEntity.query(variableId, {
        beginsWith: 'LABEL_',
      });
      return {
        statusCode: 200,
        body: JSON.stringify(serializeConfigFormat(res.Items)),
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: `Cannot get the variables ${error}`,
      };
    }
  }
  @RouteAndExec()
  execute(event) {
    return event;
  }
}
