import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { InferEntityItem } from 'dynamodb-toolbox';
import { serializeConfig, serializeConfigDelete } from '../../utils/helpers';
import { CaptureConfigEntity } from '../entities';

export const createConfigHandler: ValidatedAPIGatewayProxyHandler<
  InferEntityItem<typeof CaptureConfigEntity>
> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const userId = extractUserIdFromToken(event);
  const config = event.body;

  try {
    await CaptureConfigEntity.put({
      ...config,
      workspaceId,
      _source: 'EXTERNAL',
      userId,
    });

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
  const updateObject = serializeConfig(config).data;

  const updateItem = {
    ...config,
    config: { $set: updateObject },
    workspaceId,
    _source: 'EXTERNAL',
    userId,
  };

  try {
    await CaptureConfigEntity.update(updateItem);
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

  const updateItem = {
    entityId: event.pathParameters.configId,
    config: {
      $set: serializeConfigDelete(config.config),
    },
    workspaceId,
    _source: 'EXTERNAL',
    userId,
  };
  try {
    await CaptureConfigEntity.update(updateItem);
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