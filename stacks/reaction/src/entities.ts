import { Entity } from 'dynamodb-toolbox';
import { reactionTable } from '../service/DynamoDB';

export const UserReaction = new Entity({
  name: 'userReaction',
  attributes: {
    nodeId: { partitionKey: true },
    userId: ['sk', 0, { type: 'string', required: 'always' }],
    blockId: ['sk', 1, { type: 'string', required: 'always' }],
    sk: { hidden: true, sortKey: true },
    ak: { hidden: true, default: (data) => `${data.blockId}#${data.userId}` },
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
    nodeId: { partitionKey: true },
    sk: { hidden: true, sortKey: true },
    blockId: ['sk', 0, { type: 'string', required: 'always' }],
    reaction: [
      'sk',
      1,
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
