import { middyfy } from '@mex/middy-utils';
import { HighlightsHandler } from './handlers/highlights';

const handlerPairs = new HighlightsHandler();

export const main = middyfy(handlerPairs);
