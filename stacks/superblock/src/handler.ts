import { middyfy } from '@mex/middy-utils';
import { SuperblockPropertyHandler } from './handlers/superBlockProperty';
import { SuperblockHandler } from './handlers/superBlock';

const superblockPropertyHandler = new SuperblockPropertyHandler();
const superblockHandler = new SuperblockHandler();

export const main = middyfy(superblockPropertyHandler.execute);
export const superblock = middyfy(superblockHandler.execute);
