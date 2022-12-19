import { getAccess } from '@mex/access-checker';
import { extractUserIdFromToken, extractWorkspaceId } from '@mex/gen-utils';
import { createError } from '@middy/util';
import { ValidatedAPIGatewayProxyHandler } from '@workduck-io/lambda-routing';
import { reactionTable } from '../../service/DynamoDB';
import { ReactionCount, UserReaction } from '../entities';
import { ReactionRequest } from '../interface';

export const createHandler: ValidatedAPIGatewayProxyHandler<
  ReactionRequest
> = async (event) => {
  const workspaceId = extractWorkspaceId(event);
  const userId = extractUserIdFromToken(event);
  const reaction = event.body;
  if (reaction.workspaceId && workspaceId != reaction.workspaceId) {
    const access = await getAccess(workspaceId, reaction.nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');
  }
  const isAdd = reaction.action === 'ADD' ?? true;

  delete reaction.action;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const updateCount = ReactionCount.updateTransaction({
    ...reaction,
    count: {
      $add: isAdd ? 1 : -1,
    },
  });
  const react = UserReaction.updateTransaction(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    {
      blockId: reaction.blockId,
      nodeId: reaction.nodeId,
      userId,
      reaction: isAdd
        ? {
            $add: [`${reaction.reaction.type}_${reaction.reaction.value}`],
          }
        : {
            $delete: [`${reaction.reaction.type}_${reaction.reaction.value}`],
          },
    },
    {
      conditions: {
        attr: 'reaction',
        contains: `${reaction.reaction.type}_${reaction.reaction.value}`,
        negate: isAdd,
      },
    }
  );
  try {
    await reactionTable.transactWrite([react, updateCount]);
    return {
      statusCode: 204,
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getAllReactionsOfNodeHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);

    const userId = extractUserIdFromToken(event);
    const nodeId = event.pathParameters?.nodeId;
    const blockId = event.pathParameters?.blockId;

    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const userData = (
      await UserReaction.query(nodeId, {
        beginsWith: blockId ? `${userId}#${blockId}` : `${userId}#`,
        filters: [
          {
            attr: 'reaction',
            exists: true,
          },
        ],
      })
    ).Items.reduce(
      (acc, value) => ({
        ...acc,
        [value.blockId]: [
          ...(acc?.[value.blockId] ?? []),
          ...((value.reaction as any[]) ?? []),
        ],
      }),
      {}
    );
    const metaData = (
      await ReactionCount.query(nodeId, {
        ...(blockId && { beginsWith: blockId }),
        filters: [
          {
            attr: 'count',
            gt: 0,
          },
        ],
      })
    ).Items.reduce((acc, val) => {
      return {
        ...acc,
        [val.blockId]: [
          ...(acc[val.blockId] ?? []),
          {
            reaction: val.reaction,
            count: val.count,
            ...(userData?.[val.blockId]?.includes(val.reaction)
              ? { user: true }
              : {}),
          },
        ],
      };
    }, {});

    return {
      statusCode: 200,
      //In case blockId is passed just return the array instead of object
      body: JSON.stringify(blockId ? metaData[blockId] : metaData),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.stack));
  }
};

export const getDetailedReactionForBlockHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const { nodeId, blockId } = event.pathParameters;

    const access = await getAccess(workspaceId, nodeId, event);
    if (access === 'NO_ACCESS' || access === 'READ')
      throw createError(401, 'User access denied');

    const reactions = (
      await UserReaction.query(nodeId, {
        beginsWith: `${blockId}`,
        index: 'pk-ak-index',
        attributes: ['userId', 'reaction'],
      })
    ).Items;
    return {
      statusCode: 200,
      body: JSON.stringify(reactions),
    };
  } catch (e) {
    throw createError(400, JSON.stringify(e.message));
  }
};
