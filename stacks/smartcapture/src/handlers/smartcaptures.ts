import { getAccess } from '@mex/access-checker';
import { entityFilter, statusFilter } from '@mex/entity-utils';
import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { nanoid } from 'nanoid';
import { smartcaptureTable } from '../../service/DynamoDB';
import { serializeLabel } from '../../utils/helpers';
import { CaptureLabelEntity, CaptureVariableEntity } from '../entities';
import { Smartcapture, Variable } from '../interface';

export const createVariableHandler: ValidatedAPIGatewayProxyHandler<
  Variable
> = async (event) => {
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
};

export const createLabelHandler: ValidatedAPIGatewayProxyHandler<
  Smartcapture
> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const userId = extractUserIdFromToken(event);
  const smartcapture = event.body;
  if (smartcapture.workspaceId && workspaceId != smartcapture.workspaceId) {
    const access = await getAccess(workspaceId, smartcapture.nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
  }
  try {
    if (!smartcapture.variableId) {
      const pendingTransacts = [];
      const variableId = nanoid();
      const payload = {
        variableName: smartcapture.labelName,
        entityId: variableId,
        workspaceId,
        userId,
        _source: 'EXTERNAL',
      };
      const createVariable = CaptureVariableEntity.putTransaction(payload);
      pendingTransacts.push(createVariable);
      const labelPayload = {
        ...smartcapture,
        entityId: smartcapture.entityId ?? nanoid(),
        workspaceId,
        _source: 'EXTERNAL',
        userId,
        variableId,
      };
      const createLabel = CaptureLabelEntity.putTransaction(labelPayload);
      pendingTransacts.push(createLabel);
      await smartcaptureTable.transactWrite(pendingTransacts);
      return {
        statusCode: 204,
      };
    } else {
      const result = (
        await CaptureLabelEntity.update(
          {
            ...smartcapture,
            userId,
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
    }
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
    await CaptureLabelEntity.delete({
      workspaceId,
      entityId: labelId,
    });

    return {
      statusCode: 204,
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
