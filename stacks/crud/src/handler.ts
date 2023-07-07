import { middyfy } from '@mex/middy-utils';
import { CrudHandler } from './handlers/crud';

const crudHandler = new CrudHandler();

export const main = middyfy(crudHandler.execute);

