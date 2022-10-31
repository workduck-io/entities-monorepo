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
  const count = ReactionCount.updateTransaction({
    ...reaction,
    workspaceId,
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
      workspaceId,
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
    await reactionTable.transactWrite([react, count]);
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

    const userData = (
      await UserReaction.query(workspaceId, {
        beginsWith: blockId
          ? `${userId}#${nodeId}#${blockId}`
          : `${userId}#${nodeId}#`,
      })
    ).Items.reduce(
      (acc, value) => ({
        ...acc,
        [value.blockId]: [...(acc[value.blockId] ?? []), ...value.reaction],
      }),
      {}
    );

    const metaData = (
      await ReactionCount.query(workspaceId, {
        beginsWith: blockId ? `${nodeId}#${blockId}` : `${nodeId}#`,
      })
    ).Items.reduce((acc, val) => {
      return {
        ...acc,
        [val.blockId]: [
          ...(acc[val.blockId] ?? []),
          {
            reaction: val.reaction,
            count: val.count,
            ...(userData[val.blockId]?.includes(val.reaction)
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
    throw createError(400, JSON.stringify(e.message));
  }
};

export const getDetailedReactionForBlockHandler: ValidatedAPIGatewayProxyHandler<
  undefined
> = async (event) => {
  try {
    const workspaceId = extractWorkspaceId(event);
    const { nodeId, blockId } = event.pathParameters;
    const reactions = (
      await UserReaction.query(workspaceId, {
        eq: `${nodeId}#${blockId}`,
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
