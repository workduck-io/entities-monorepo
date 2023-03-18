import { middyfy } from '@mex/middy-utils';
import { CommentsHandler } from './handlers/comments';

const commentsHandler = new CommentsHandler();

export const comments = middyfy(commentsHandler.execute);
