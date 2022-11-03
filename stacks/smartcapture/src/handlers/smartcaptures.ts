import { getAccess } from '@mex/access-checker';
import {
  extractWorkspaceId,
  ValidatedAPIGatewayProxyHandler,
} from '@mex/gen-utils';
import { entityFilter, statusFilter } from '@mex/entity-utils';
import { createError } from '@middy/util';
import { CaptureLabelEntity, CaptureVariableEntity } from '../entities';
import { nanoid } from 'nanoid';
import { Smartcapture, Variable } from '../interface';
import { serializeLabel } from '../../utils/helpers';

export const createVariableHandler: ValidatedAPIGatewayProxyHandler<
  Variable
> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const variable = event.body;
  if (variable.workspaceId && workspaceId != variable.workspaceId) {
    const access = await getAccess(workspaceId, variable.nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
  }
  try {
    const res = (
      await CaptureVariableEntity.update(
        {
          variableName: variable.variableName,
          entityId: variable.entityId ?? nanoid(),
          workspaceId,
          _source: 'EXTERNAL',
        },
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

export const getAllVariablesHandler: ValidatedAPIGatewayProxyHandler<
  Variable
> = async (event) => {
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
};

export const getVariableHandler: ValidatedAPIGatewayProxyHandler<
  Variable
> = async (event) => {
  const workspaceId = extractWorkspaceId(event) as string;
  const variableId = event.pathParameters.variableId;
  try {
    const res = await (
      await CaptureVariableEntity.get({
        workspaceId,
        entityId: variableId,
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

export const deleteVariableHandler: ValidatedAPIGatewayProxyHandler<
  Variable
> = async (event) => {
  const workspaceId = extractWorkspaceId(event) as string;
  const variableId = event.pathParameters.variableId;
  try {
    const res = await (
      await CaptureVariableEntity.delete({
        workspaceId,
        entityId: variableId,
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

export const createLabelHandler: ValidatedAPIGatewayProxyHandler<
  Smartcapture
> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const smartcapture = event.body;
  if (smartcapture.workspaceId && workspaceId != smartcapture.workspaceId) {
    const access = await getAccess(workspaceId, smartcapture.nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
  }
  try {
    const result = (
      await CaptureLabelEntity.update(
        {
          ...smartcapture,
          entityId: smartcapture.entityId ?? nanoid(),
          workspaceId,
          _source: 'EXTERNAL',
        },
        {
          returnValues: 'ALL_NEW',
        }
      )
    ).Attributes;
    return {
      statusCode: 200,
      body: JSON.stringify(serializeLabel([result])),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getAllLabelsHandler: ValidatedAPIGatewayProxyHandler<
  Variable
> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  try {
    const res = (
      await CaptureVariableEntity.query(workspaceId, {
        beginsWith: 'LABEL',
        filters: [statusFilter('ACTIVE'), entityFilter('captureLabel')],
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

export const getLabelHandler: ValidatedAPIGatewayProxyHandler<
  Variable
> = async (event) => {
  const workspaceId = extractWorkspaceId(event) as string;
  const labelId = event.pathParameters.labelId;
  try {
    const res = await (
      await CaptureLabelEntity.get({
        workspaceId,
        entityId: labelId,
      })
    ).Item;

    return {
      statusCode: 200,
      body: JSON.stringify(serializeLabel([res])),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getAllLabelsForWebpageHandler: ValidatedAPIGatewayProxyHandler<
  Variable
> = async (event) => {
  const workspaceId = extractWorkspaceId(event) as string;
  const webPage = event.pathParameters.webPage;
  try {
    const res = await (
      await CaptureLabelEntity.query(workspaceId, {
        index: 'pk-ak-index',
        eq: webPage,
        filters: [statusFilter('ACTIVE'), entityFilter('captureLabel')],
      })
    ).Items;

    return {
      statusCode: 200,
      body: JSON.stringify(serializeLabel(res)),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const deleteLabelHandler: ValidatedAPIGatewayProxyHandler<
  Variable
> = async (event) => {
  const workspaceId = extractWorkspaceId(event) as string;
  const labelId = event.pathParameters.labelId;
  try {
    const res = await (
      await CaptureLabelEntity.delete({
        workspaceId,
        entityId: labelId,
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
