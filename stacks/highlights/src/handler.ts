import { middyfy } from '@mex/middy-utils';
import { HighlightsHandler } from './handlers/highlights';

const highlightsHandler = new HighlightsHandler();

export const main = middyfy(highlightsHandler.execute);
