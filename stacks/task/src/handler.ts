import { middyfy } from '@mex/middy-utils';
import { TaskHandler } from './handlers/tasks';
import { ViewHandler } from './handlers/view';

export const task = middyfy(new TaskHandler().execute);
export const view = middyfy(new ViewHandler().execute);
