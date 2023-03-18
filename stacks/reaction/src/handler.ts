import { middyfy } from '@mex/middy-utils';
import { ReactionkHandler } from './handlers/reaction';

const reactionHandler = new ReactionkHandler()

export  const reaction = middyfy(reactionHandler.execute);
