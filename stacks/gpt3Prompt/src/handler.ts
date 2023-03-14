import { middyfy } from '@mex/middy-utils';
import { PromtHandlersHandler } from './handlers/promptHandler';

const handlerPairs = new PromtHandlersHandler();

export const main = middyfy(handlerPairs);
