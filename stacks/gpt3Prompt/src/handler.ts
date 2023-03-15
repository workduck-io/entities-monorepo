import { middyfy } from '@mex/middy-utils';
import { PromptsHandler } from './handlers/promptHandler';

const promptHandler = new PromptsHandler();

export const main = middyfy(promptHandler.execute);
