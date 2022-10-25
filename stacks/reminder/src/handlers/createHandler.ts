import { getAccess } from '@mex/access-checker';
import {
  extractUserIdFromToken,
  extractWorkspaceId,
} from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { ReminderEntity } from '../entities';
import { Reminder } from '../interface';

export const createHandler: ValidatedAPIGatewayProxyHandler<Reminder> = async (
  event
) => {
  const workspaceId = extractWorkspaceId(event);
  const userId = extractUserIdFromToken(event);
  const reminder = event.body;
  if (reminder.workspaceId && workspaceId != reminder.workspaceId) {
    const access = await getAccess(workspaceId, reminder.nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
  }
  try {
    const res = (
      await ReminderEntity.update(
        { ...reminder, workspaceId, userId },
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
