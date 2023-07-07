import { middyfy } from '@mex/middy-utils';
import { SuperblockPropertyHandler } from './handlers/superBlockProperty';

const superblockHandler = new SuperblockPropertyHandler();

export const main = middyfy(superblockHandler.execute);
