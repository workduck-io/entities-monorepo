import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { ENTITYSOURCE } from '../../utils/consts';
import { smartcaptureTable } from '../../service/DynamoDB';
import {
  serializeConfig,
  serializeConfigDelete,
  serializeConfigFormat,
} from '../../utils/helpers';
import { CaptureConfigEntity, CaptureVariableLabelEntity } from '../entities';
import { Label } from '../interface';

export const createConfigHandler: ValidatedAPIGatewayProxyHandler<any> = async (
  event
) => {
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
};

export const updateConfigHandler: ValidatedAPIGatewayProxyHandler<any> = async (
  event
) => {
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
};

export const deleteLabelHandler: ValidatedAPIGatewayProxyHandler<any> = async (
  event
) => {
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
};

export const getConfigHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
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
};

export const getAllConfigOfWorkspace: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
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
};

export const getAllConfigOfPublic: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
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
};

export const getAllConfigOfBase: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
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
};

export const deleteConfigHandler: ValidatedAPIGatewayProxyHandler<any> = async (
  event
) => {
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
};

export const getAllLabelsForVariable: ValidatedAPIGatewayProxyHandler<
  any
> = async (event) => {
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
};
