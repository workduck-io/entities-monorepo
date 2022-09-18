import { getAccess } from '@mex/access-checker';
import {
  extractWorkspaceId,
  ValidatedAPIGatewayProxyHandler,
} from '@mex/gen-utils';
import { middyfy } from '@mex/middy-utils';
import { createError } from '@middy/util';
import { ReactionEntity } from './entities';
import { Reaction } from './interface';

const createHandler: ValidatedAPIGatewayProxyHandler<Reaction> = async (
  event
) => {
  const workspaceId = extractWorkspaceId(event);
  const reaction = event.body;
  if (reaction.workspaceId && workspaceId != reaction.workspaceId) {
    const access = await getAccess(workspaceId, reaction.nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
  }
  try {
    const res = (
      await ReactionEntity.update(
        { ...reaction, workspaceId, source: 'EXTERNAL' },
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
export const create = middyfy(createHandler);
