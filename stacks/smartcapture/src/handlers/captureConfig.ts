import {
  extractUserIdFromToken,
  extractWorkspaceId,
  InternalError,
} from '@mex/gen-utils';
import {
  HTTPMethod,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { ENTITYSOURCE } from '../../utils/consts';
import { smartcaptureTable } from '../../service/DynamoDB';
import {
  serializeConfig,
  serializeConfigDelete,
  serializeConfigFormat,
} from '../../utils/helpers';
import { CaptureConfigEntity, CaptureVariableLabelEntity } from '../entities';
import { Config, Label } from '../interface';
import { getPathForEntity, HierarchyOps } from '@mex/entity-utils';

const CaptureConfigHierarchyOps = new HierarchyOps(CaptureConfigEntity);

@InternalError()
export class CaptureConfigHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/config',
  })
  async createConfigHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const config = event.body;
    const labels = config.labels;
    const allTransacts = [];

    await CaptureConfigHierarchyOps.addItem<Config>(
      { entityId: config.entityId, workspaceId },
      {
        ...config,
        entityId: config.entityId,
        userId,
        _source: ENTITYSOURCE.EXTERNAL,
        workspaceId,
      }
    );

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
    await smartcaptureTable.transactWrite(allTransacts);
    return {
      statusCode: 204,
    };
  }

  @Route({
    method: HTTPMethod.PATCH,
    path: '/config/{configId}',
  })
  async updateConfigHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
    const workspaceId = extractWorkspaceId(event);
    const userId = extractUserIdFromToken(event);
    const config = event.body;
    const labels = config.labels as Label[];
    const allTransacts = [];
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
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/config/{configId}/labels',
  })
  async deleteConfigLabelHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
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

    await smartcaptureTable.transactWrite(allTransacts);
    return {
      statusCode: 204,
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/config/{configId}',
  })
  async getConfigHandler(event: ValidatedAPIGatewayProxyEvent<undefined>) {
    const configId = event.pathParameters.configId;
    const response = await CaptureConfigHierarchyOps.getItem(configId);

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/config/all',
  })
  async getAllConfigOfWorkspace(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
    const workspaceId = extractWorkspaceId(event) as string;
    const res = (
      await CaptureConfigEntity.query(workspaceId, {
        beginsWith: 'CONFIG_',
      })
    ).Items;

    return {
      statusCode: 200,
      body: JSON.stringify(
        await getPathForEntity(CaptureConfigHierarchyOps, workspaceId, res)
      ),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/config/all/public',
  })
  async getAllConfigOfPublic(event: ValidatedAPIGatewayProxyEvent<undefined>) {
    const res = (
      await CaptureConfigEntity.query('WORKSPACE_INTERNAL', {
        beginsWith: 'CONFIG_',
      })
    ).Items;
    return {
      statusCode: 200,
      body: JSON.stringify(
        await getPathForEntity(
          CaptureConfigHierarchyOps,
          'WORKSPACE_INTERNAL',
          res
        )
      ),
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/config/all/{base}',
  })
  async getAllConfigOfBase(event: ValidatedAPIGatewayProxyEvent<undefined>) {
    const workspaceId = extractWorkspaceId(event) as string;
    const res = (
      await CaptureConfigEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: event.pathParameters.base,
      })
    ).Items;
    return {
      statusCode: 200,
      body: JSON.stringify(
        await getPathForEntity(CaptureConfigHierarchyOps, workspaceId, res)
      ),
    };
  }

  @Route({
    method: HTTPMethod.DELETE,
    path: '/config/{configId}',
  })
  async deleteConfigHandler(event: ValidatedAPIGatewayProxyEvent<any>) {
    const configId = event.pathParameters.configId;
    await CaptureConfigHierarchyOps.deleteItem(configId);
    return {
      statusCode: 204,
    };
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/variable/{variableId}/labels/all',
  })
  async getAllLabelsForVariable(event: ValidatedAPIGatewayProxyEvent<any>) {
    const variableId = event.pathParameters.variableId;
    const res = await CaptureVariableLabelEntity.query(variableId, {
      beginsWith: 'LABEL_',
    });
    return {
      statusCode: 200,
      body: JSON.stringify(serializeConfigFormat(res.Items)),
    };
  }
  @RouteAndExec()
  execute(event) {
    return event;
  }
}
