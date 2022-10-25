import { itemFilter } from '@mex/entity-utils';
import { extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { ReminderEntity } from '../entities';

export const getAllEntitiesOfWorkspaceHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  const lastKey = event.queryStringParameters?.lastKey;
  try {
    const workspaceId = extractWorkspaceId(event);
    const res = await ReminderEntity.query(workspaceId, {
      startKey: lastKey && {
        pk: workspaceId,
        sk: lastKey,
      },
      filters: [itemFilter('ACTIVE')],
    });
    return {
      statusCode: 200,
      body: JSON.stringify({
        Items: res.Items,
        lastKey: res.LastEvaluatedKey?.sk ?? undefined,
      }),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
