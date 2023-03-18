import { getAccess } from '@mex/access-checker';
import {
  extractUserIdFromToken,
  extractWorkspaceId,
  InternalError,
} from '@mex/gen-utils';
import { createError } from '@middy/util';
import {
  HTTPMethod,
  Route,
  RouteAndExec,
  ValidatedAPIGatewayProxyEvent,
} from '@workduck-io/lambda-routing';
import { reactionTable } from '../../service/DynamoDB';
import { ReactionCount, UserReaction } from '../entities';
import { ReactionRequest } from '../interface';

@InternalError()
export class ReactionkHandler {
  @Route({
    method: HTTPMethod.POST,
    path: '/',
  })
  async createHandler(event: ValidatedAPIGatewayProxyEvent<ReactionRequest>) {
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
    await reactionTable.transactWrite([react, updateCount]);
    return {
      statusCode: 204,
    };
  }
  @Route({
    method: HTTPMethod.GET,
    path: '/node/{nodeId}',
  })
  @Route({
    method: HTTPMethod.GET,
    path: '/node/{nodeId}/block/{blockId}',
  })
  async getAllReactionsOfNodeHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
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
  }

  @Route({
    method: HTTPMethod.GET,
    path: '/node/{nodeId}/block/{blockId}/details',
  })
  async getDetailedReactionForBlockHandler(
    event: ValidatedAPIGatewayProxyEvent<undefined>
  ) {
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
  }

  @RouteAndExec()
  execute(event) {
    return event;
  }
}
