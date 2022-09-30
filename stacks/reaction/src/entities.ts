import { Entity } from 'dynamodb-toolbox';
import { reactionTable } from '../service/DynamoDB';

export const UserReaction = new Entity({
  name: 'userReaction',
  attributes: {
    workspaceId: { partitionKey: true },
    userId: ['sk', 0, { type: 'string', required: 'always' }],
    nodeId: ['sk', 1, { type: 'string', required: 'always' }],
    blockId: ['sk', 2, { type: 'string', required: 'always' }],
    sk: { hidden: true, sortKey: true },
    reaction: {
      type: 'set',
      setType: 'string',
      default: () => [],
    },
  },
  table: reactionTable,
});

export const ReactionCount = new Entity({
  name: 'reactionCount',
  timestamps: false,
  attributes: {
    workspaceId: { partitionKey: true },
    sk: { hidden: true, sortKey: true },
    nodeId: ['sk', 0, { type: 'string', required: 'always' }],
    blockId: ['sk', 1, { type: 'string', required: 'always' }],
    reaction: [
      'sk',
      2,
      {
        type: 'string',
        required: 'always',
        transform: (_, data: any) =>
          `${data.reaction.type}_${data.reaction.value}`,
      },
    ],
    count: { type: 'number', default: () => 0 },
  },
  table: reactionTable,
});
